import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// ── Mock AuthService ──────────────────────────────────────────────────────────

const mockAuthService = {
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
  register: jest.fn(),
  refreshToken: jest.fn(),
};

// ── App bootstrap ─────────────────────────────────────────────────────────────

async function createApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [{ provide: AuthService, useValue: mockAuthService }],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();
  return app;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  // ── POST /auth/send-otp ────────────────────────────────────────────────────

  describe('POST /auth/send-otp', () => {
    it('returns 201 with success message', async () => {
      mockAuthService.sendOtp.mockResolvedValueOnce({
        message: 'OTP sent to +919999999999',
        expiresIn: 600,
      });

      const res = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: '9999999999' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ message: expect.stringContaining('9999999999') });
    });

    it('returns 400 for an invalid phone payload', async () => {
      const res = await request(app.getHttpServer()).post('/auth/send-otp').send({ phone: '' });

      expect(res.status).toBe(400);
    });
  });

  // ── POST /auth/verify-otp ─────────────────────────────────────────────────

  describe('POST /auth/verify-otp', () => {
    it('returns 201 with tokens on valid OTP', async () => {
      mockAuthService.verifyOtp.mockResolvedValueOnce({
        isNewUser: false,
        user: { id: 'user-1', phone: '9999999999', role: 'user' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 604800,
      });

      const res = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone: '9999999999', otp: '123456' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ accessToken: 'access-token' });
    });

    it('propagates 401 from service for invalid OTP', async () => {
      const { UnauthorizedException } = await import('@nestjs/common');
      mockAuthService.verifyOtp.mockRejectedValueOnce(
        new UnauthorizedException('Invalid or expired OTP.'),
      );

      const res = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone: '9999999999', otp: '000000' });

      expect(res.status).toBe(401);
    });
  });

  // ── POST /auth/refresh ────────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('returns 201 with new tokens for a valid refresh token', async () => {
      mockAuthService.refreshToken.mockResolvedValueOnce({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: 604800,
      });

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ accessToken: 'new-access' });
    });
  });
});
