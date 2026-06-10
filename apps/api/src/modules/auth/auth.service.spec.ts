import { HttpException, NotFoundException } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';
import { http, HttpResponse } from 'msw';

import { DbService } from '../../db/db.service';
import { otpVerifications } from '../../db/schema';
import { clearTables, startTestDb, type TestDb } from '../../test/db-helper';
import { mswServer } from '../../test/msw-server';
import { seedOtp, seedUser } from '../../test/fixtures';

import { AuthService } from './auth.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockJwtService = {
  sign: jest.fn().mockReturnValue('test-jwt-token'),
  verify: jest.fn(),
} as unknown as JwtService;

function makeConfigService(nodeEnv = 'development'): ConfigService {
  return {
    get: jest.fn((key: string, fallback?: unknown) => {
      const map: Record<string, unknown> = {
        nodeEnv,
        'twilio.accountSid': 'ACtest123',
        'twilio.authToken': 'test-auth-token',
        'twilio.phoneNumber': '+10000000000',
        'twilio.otpExpiryMinutes': 10,
        'jwt.secret': 'test-secret',
        'jwt.refreshSecret': 'test-refresh-secret',
        'jwt.expiresIn': '7d',
        'jwt.refreshExpiresIn': '30d',
      };
      return map[key] ?? fallback;
    }),
  } as unknown as ConfigService;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthService (integration)', () => {
  let db: TestDb;
  let stopDb: () => Promise<void>;
  let dbService: DbService;
  let service: AuthService;

  beforeAll(async () => {
    ({ db, stop: stopDb } = await startTestDb());

    dbService = new DbService();
    await dbService.onModuleInit();

    service = new AuthService(dbService, mockJwtService, makeConfigService());
  });

  afterAll(async () => {
    await dbService.onModuleDestroy();
    await stopDb();
  });

  beforeEach(async () => {
    await clearTables(db);
    jest.clearAllMocks();
    (mockJwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');
  });

  // ── sendOtp ────────────────────────────────────────────────────────────────

  describe('sendOtp', () => {
    it('inserts an OTP record and returns a success message in dev mode', async () => {
      const result = await service.sendOtp({ phone: '9876543210' });

      expect(result).toMatchObject({
        message: expect.stringContaining('9876543210'),
        expiresIn: 600,
      });

      const otp = await db.query.otpVerifications.findFirst({
        where: (t, { eq }) => eq(t.phone, '9876543210'),
      });
      expect(otp).toBeDefined();
      expect(otp!.isUsed).toBe(false);
    });

    it('throws TOO_MANY_REQUESTS when a recent unused OTP already exists', async () => {
      await seedOtp(db, '9876543210');

      await expect(service.sendOtp({ phone: '9876543210' })).rejects.toThrow(HttpException);
    });

    it('calls Twilio in production mode (MSW intercepts the HTTP request)', async () => {
      let twilioWasCalled = false;
      mswServer.use(
        http.post(
          'https://api.twilio.com/2010-04-01/Accounts/:accountSid/Messages.json',
          () => {
            twilioWasCalled = true;
            return HttpResponse.json({ sid: 'SM_prod_test', status: 'queued' });
          },
        ),
      );

      const prodService = new AuthService(
        dbService,
        mockJwtService,
        makeConfigService('production'),
      );
      const result = await prodService.sendOtp({ phone: '9876543210' });

      expect(twilioWasCalled).toBe(true);
      expect(result.message).toContain('9876543210');
    });
  });

  // ── verifyOtp ──────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    it('creates a user + wallet for a new phone number and returns isNewUser=true', async () => {
      await seedOtp(db, '9876543210', '654321');

      const result = await service.verifyOtp({ phone: '9876543210', otp: '654321' });

      expect(result.isNewUser).toBe(true);
      expect(result.user.phone).toBe('9876543210');
      expect(result.accessToken).toBe('test-jwt-token');

      const wallet = await db.query.wallets.findFirst({
        where: (t, { eq }) => eq(t.userId, result.user.id),
      });
      expect(wallet).toBeDefined();
    });

    it('returns existing user and isNewUser=false when account already exists', async () => {
      await seedUser(db, { phone: '9876543210', name: 'Existing User' });
      await seedOtp(db, '9876543210', '111111');

      const result = await service.verifyOtp({ phone: '9876543210', otp: '111111' });

      expect(result.isNewUser).toBe(false);
      expect(result.user.name).toBe('Existing User');
    });

    it('throws UnauthorizedException for an OTP that does not match', async () => {
      await expect(
        service.verifyOtp({ phone: '9876543210', otp: '000000' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for an expired OTP', async () => {
      await db.insert(otpVerifications).values({
        phone: '9876543210',
        otp: '999999',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.verifyOtp({ phone: '9876543210', otp: '999999' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the user account is suspended', async () => {
      await seedUser(db, { phone: '9876543210', isActive: false });
      await seedOtp(db, '9876543210', '222222');

      await expect(
        service.verifyOtp({ phone: '9876543210', otp: '222222' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('marks the OTP as used after successful verification', async () => {
      await seedOtp(db, '9876543210', '333333');

      await service.verifyOtp({ phone: '9876543210', otp: '333333' });

      const otp = await db.query.otpVerifications.findFirst({
        where: (t, { eq }) => eq(t.phone, '9876543210'),
      });
      expect(otp!.isUsed).toBe(true);
    });
  });

  // ── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('updates name and email on the user record', async () => {
      const user = await seedUser(db, { phone: '9876543210', name: null, email: null });

      const result = await service.register(user.id, {
        name: 'Alice',
        email: 'alice@example.com',
      });

      expect(result.name).toBe('Alice');
      expect(result.email).toBe('alice@example.com');
    });

    it('throws NotFoundException when the user does not exist', async () => {
      await expect(
        service.register('nonexistent-id', { name: 'Ghost' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the email is taken by another user', async () => {
      await seedUser(db, { phone: '9876543210', email: 'taken@example.com' });
      const user2 = await seedUser(db, { phone: '9123456789', email: null });

      const { BadRequestException } = await import('@nestjs/common');
      await expect(
        service.register(user2.id, { name: 'Bob', email: 'taken@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── refreshToken ───────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('issues new tokens for a valid refresh token', async () => {
      const user = await seedUser(db);
      (mockJwtService.verify as jest.Mock).mockReturnValueOnce({ sub: user.id });

      const result = await service.refreshToken('valid-token');

      expect(result).toMatchObject({ accessToken: 'test-jwt-token', refreshToken: 'test-jwt-token' });
    });

    it('throws UnauthorizedException when the token is malformed', async () => {
      (mockJwtService.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('jwt malformed');
      });

      await expect(service.refreshToken('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the user is suspended', async () => {
      const user = await seedUser(db, { isActive: false });
      (mockJwtService.verify as jest.Mock).mockReturnValueOnce({ sub: user.id });

      await expect(service.refreshToken('valid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
