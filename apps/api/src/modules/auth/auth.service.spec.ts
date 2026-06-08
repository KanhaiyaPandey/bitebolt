import { HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { DbService } from '../../db/db.service';

import { AuthService } from './auth.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}) => ({
  id: 'user-1',
  phone: '9999999999',
  name: 'Test User',
  email: 'test@example.com',
  avatarUrl: null,
  role: 'user',
  isActive: true,
  ...overrides,
});

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockDb = {
  db: {
    query: {
      otpVerifications: { findFirst: jest.fn() },
    },
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string, fallback?: unknown) => {
    const map: Record<string, unknown> = {
      'twilio.accountSid': 'ACtest',
      'twilio.authToken': 'test-auth',
      'twilio.otpExpiryMinutes': 10,
      'twilio.phoneNumber': '+10000000000',
      nodeEnv: 'development',
      'jwt.secret': 'secret',
      'jwt.refreshSecret': 'refresh-secret',
      'jwt.expiresIn': '7d',
      'jwt.refreshExpiresIn': '30d',
    };
    return map[key] ?? fallback;
  }),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DbService, useValue: mockDb },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── sendOtp ────────────────────────────────────────────────────────────────

  describe('sendOtp', () => {
    it('throws TOO_MANY_REQUESTS when a recent OTP exists', async () => {
      mockDb.db.query.otpVerifications.findFirst.mockResolvedValueOnce({ id: 'otp-1' });

      await expect(service.sendOtp({ phone: '9999999999' })).rejects.toThrow(HttpException);
    });

    it('inserts OTP and returns success message in dev mode', async () => {
      mockDb.db.query.otpVerifications.findFirst.mockResolvedValueOnce(null);
      mockDb.db.returning.mockResolvedValueOnce([]);

      const result = await service.sendOtp({ phone: '9999999999' });

      expect(mockDb.db.insert).toHaveBeenCalled();
      expect(result).toMatchObject({ message: expect.stringContaining('9999999999') });
    });
  });

  // ── verifyOtp ──────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    it('throws UnauthorizedException for invalid OTP', async () => {
      mockDb.db.query.otpVerifications.findFirst.mockResolvedValueOnce(null);
      mockDb.db.returning.mockResolvedValueOnce([]);

      await expect(service.verifyOtp({ phone: '9999999999', otp: '000000' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns tokens and user for a new user', async () => {
      const user = makeUser();
      mockDb.db.query.otpVerifications.findFirst.mockResolvedValueOnce({ id: 'otp-1' });
      // mark OTP used
      mockDb.db.returning.mockResolvedValueOnce([]);
      // select existing user → empty (new user)
      mockDb.db.from.mockReturnValueOnce({ where: jest.fn().mockResolvedValueOnce([]) });
      // insert user
      mockDb.db.returning.mockResolvedValueOnce([user]);
      // insert wallet
      mockDb.db.returning.mockResolvedValueOnce([]);

      const result = await service.verifyOtp({ phone: '9999999999', otp: '123456' });

      expect(result).toMatchObject({
        isNewUser: true,
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
      });
    });

    it('throws UnauthorizedException for a suspended user', async () => {
      const suspendedUser = makeUser({ isActive: false });
      mockDb.db.query.otpVerifications.findFirst.mockResolvedValueOnce({ id: 'otp-1' });
      mockDb.db.returning.mockResolvedValueOnce([]);
      mockDb.db.from.mockReturnValueOnce({
        where: jest.fn().mockResolvedValueOnce([suspendedUser]),
      });

      await expect(service.verifyOtp({ phone: '9999999999', otp: '123456' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockDb.db.from.mockReturnValueOnce({ where: jest.fn().mockResolvedValueOnce([]) });

      await expect(
        service.register('nonexistent-id', { name: 'Test', email: 'a@b.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates and returns user profile', async () => {
      const user = makeUser();
      const updated = { ...user, name: 'Updated', email: 'new@example.com' };

      mockDb.db.from.mockReturnValueOnce({ where: jest.fn().mockResolvedValueOnce([user]) });
      // email uniqueness check
      mockDb.db.from.mockReturnValueOnce({ where: jest.fn().mockResolvedValueOnce([]) });
      mockDb.db.returning.mockResolvedValueOnce([updated]);

      const result = await service.register(user.id, { name: 'Updated', email: 'new@example.com' });

      expect(result).toMatchObject({ name: 'Updated', email: 'new@example.com' });
    });
  });

  // ── refreshToken ───────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('throws UnauthorizedException for an invalid token', async () => {
      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('invalid');
      });

      await expect(service.refreshToken('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('returns new tokens for a valid refresh token', async () => {
      const user = makeUser();
      mockJwt.verify.mockReturnValueOnce({ sub: user.id });
      mockDb.db.from.mockReturnValueOnce({ where: jest.fn().mockResolvedValueOnce([user]) });

      const result = await service.refreshToken('valid-token');

      expect(result).toMatchObject({ accessToken: 'mock-token', refreshToken: 'mock-token' });
    });
  });
});
