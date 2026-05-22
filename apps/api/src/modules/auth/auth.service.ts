import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { and, eq, gt, ne, sql } from 'drizzle-orm';
import { Twilio } from 'twilio';
import { generateOtp } from '@bitebolt/utils';

import { DbService } from '../../db/db.service';
import { otpVerifications, users, wallets } from '../../db/schema';
import type { SendOtpDto } from './dto/send-otp.dto';
import type { VerifyOtpDto } from './dto/verify-otp.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private twilioClient: Twilio;

  constructor(
    private db: DbService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.twilioClient = new Twilio(
      this.configService.get('twilio.accountSid'),
      this.configService.get('twilio.authToken'),
    );
  }

  // ── Send OTP ────────────────────────────────────────────────────────────────

  async sendOtp(dto: SendOtpDto) {
    const { phone } = dto;
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const recentOtp = await this.db.db.query.otpVerifications.findFirst({
      where: (t, { and, eq, gt }) =>
        and(
          eq(t.phone, phone),
          eq(t.isUsed, false),
          gt(t.expiresAt, new Date()),
          gt(t.createdAt, oneMinuteAgo),
        ),
    });

    if (recentOtp) {
      throw new HttpException('Please wait before requesting another OTP.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const otp = generateOtp();
    const expiryMinutes = this.configService.get<number>('twilio.otpExpiryMinutes', 10);

    await this.db.db.insert(otpVerifications).values({
      phone,
      otp,
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    });

    if (this.configService.get('nodeEnv') !== 'development') {
      try {
        await this.twilioClient.messages.create({
          body: `Your BiteBolt OTP is ${otp}. Valid for ${expiryMinutes} minutes. Do not share this with anyone.`,
          from: this.configService.get('twilio.phoneNumber'),
          to: `+91${phone}`,
        });
      } catch (error) {
        this.logger.error(`Failed to send OTP via Twilio: ${error}`);
        throw new BadRequestException('Failed to send OTP. Please try again.');
      }
    } else {
      this.logger.log(`🔐 DEV OTP for ${phone}: ${otp}`);
    }

    return { message: `OTP sent to +91${phone}`, expiresIn: expiryMinutes * 60 };
  }

  // ── Verify OTP & Login/Register ─────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, otp } = dto;

    const otpRecord = await this.db.db.query.otpVerifications.findFirst({
      where: (t, { and, eq, gt }) =>
        and(eq(t.phone, phone), eq(t.otp, otp), eq(t.isUsed, false), gt(t.expiresAt, new Date())),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    if (!otpRecord) {
      await this.db.db
        .update(otpVerifications)
        .set({ attempts: sql`${otpVerifications.attempts} + 1` })
        .where(and(eq(otpVerifications.phone, phone), eq(otpVerifications.isUsed, false)));
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    await this.db.db
      .update(otpVerifications)
      .set({ isUsed: true })
      .where(eq(otpVerifications.id, otpRecord.id));

    let [user] = await this.db.db.select().from(users).where(eq(users.phone, phone));
    const isNewUser = !user;

    if (!user) {
      [user] = await this.db.db.insert(users).values({ phone }).returning();

      await this.db.db.insert(wallets).values({ userId: user.id });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been suspended. Contact support.');
    }

    const tokens = this.generateTokens(user.id, user.phone, user.role);

    return {
      isNewUser,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      ...tokens,
    };
  }

  // ── Complete Registration ─────────────────────────────────────────────────────

  async register(userId: string, dto: RegisterDto) {
    const [user] = await this.db.db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new NotFoundException('User not found.');

    if (dto.email) {
      const [existingEmail] = await this.db.db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, dto.email), ne(users.id, userId)));
      if (existingEmail) {
        throw new BadRequestException('Email already in use by another account.');
      }
    }

    const [updated] = await this.db.db
      .update(users)
      .set({ name: dto.name, email: dto.email })
      .where(eq(users.id, userId))
      .returning();

    return {
      id: updated.id,
      phone: updated.phone,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    };
  }

  // ── Refresh Token ─────────────────────────────────────────────────────────────

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const [user] = await this.db.db.select().from(users).where(eq(users.id, payload.sub));
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      return this.generateTokens(user.id, user.phone, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  // ── Helper: Generate Tokens ──────────────────────────────────────────────────

  private generateTokens(userId: string, phone: string, role: string) {
    const payload = { sub: userId, phone, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn', '7d'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn', '30d'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }
}
