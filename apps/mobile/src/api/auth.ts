import apiClient from './client';
import type { SendOtpDto, VerifyOtpDto, AuthTokens } from '@bitebolt/types';

export const authApi = {
  sendOtp: (dto: SendOtpDto) =>
    apiClient.post<unknown, { message: string; expiresIn: number }>('/auth/send-otp', dto),

  verifyOtp: (dto: VerifyOtpDto) =>
    apiClient.post<unknown, {
      isNewUser: boolean;
      user: { id: string; phone: string; name: string | null; role: string };
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>('/auth/verify-otp', dto),

  register: (data: { name: string; email?: string }) =>
    apiClient.post('/auth/register', data),

  refresh: (refreshToken: string) =>
    apiClient.post<unknown, AuthTokens>('/auth/refresh', { refreshToken }),
};
