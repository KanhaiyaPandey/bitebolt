import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { DbService } from '../../../db/db.service';
import { users } from '../../../db/schema';

interface JwtPayload {
  sub: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private db: DbService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret', 'changeme'),
    });
  }

  async validate(payload: JwtPayload) {
    const [user] = await this.db.db
      .select({
        id: users.id,
        phone: users.phone,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, payload.sub));

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or account suspended.');
    }

    return user;
  }
}
