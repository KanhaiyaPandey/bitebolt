import * as SecureStore from 'expo-secure-store';
import { http, HttpResponse } from 'msw';

import apiClient from '../../api/client';
import { mswServer } from '../../mocks/server';

const BASE = 'http://localhost:3001/api/v1';

const ok = (data: unknown) => HttpResponse.json({ success: true, statusCode: 200, data });
const fail = (message: string, status: number) =>
  HttpResponse.json({ success: false, statusCode: status, message }, { status });

const getSecureStore = SecureStore.getItemAsync as jest.Mock;
const setSecureStore = SecureStore.setItemAsync as jest.Mock;
const delSecureStore = SecureStore.deleteItemAsync as jest.Mock;

describe('apiClient interceptors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSecureStore.mockResolvedValue(null);
    setSecureStore.mockResolvedValue(undefined);
    delSecureStore.mockResolvedValue(undefined);
  });

  // ── Request interceptor ───────────────────────────────────────────────────

  describe('request interceptor', () => {
    it('attaches Bearer token from SecureStore when one exists', async () => {
      getSecureStore.mockResolvedValueOnce('my-access-token');

      let capturedAuthHeader: string | null = null;
      mswServer.use(
        http.get(`${BASE}/users/me`, ({ request }) => {
          capturedAuthHeader = request.headers.get('authorization');
          return ok({ id: 'user-1' });
        }),
      );

      await apiClient.get('/users/me');

      expect(capturedAuthHeader).toBe('Bearer my-access-token');
    });

    it('sends requests without an Authorization header when no token is stored', async () => {
      getSecureStore.mockResolvedValue(null);

      let capturedAuthHeader: string | null | undefined = 'not-checked';
      mswServer.use(
        http.get(`${BASE}/users/me`, ({ request }) => {
          capturedAuthHeader = request.headers.get('authorization');
          return ok({ id: 'user-1' });
        }),
      );

      await apiClient.get('/users/me');

      expect(capturedAuthHeader).toBeNull();
    });
  });

  // ── Response interceptor: data unwrapping ─────────────────────────────────

  describe('response interceptor - data unwrapping', () => {
    it('unwraps response.data.data when the server wraps in { data: ... }', async () => {
      mswServer.use(
        http.get(`${BASE}/categories`, () => ok([{ id: 'cat-1', name: 'Main Course' }])),
      );

      const result = await apiClient.get('/categories');

      expect(result).toEqual([{ id: 'cat-1', name: 'Main Course' }]);
    });

    it('returns response.data directly when there is no nested .data property', async () => {
      mswServer.use(
        http.get(`${BASE}/categories`, () =>
          HttpResponse.json([{ id: 'cat-1', name: 'Main Course' }]),
        ),
      );

      const result = await apiClient.get('/categories');

      expect(result).toEqual([{ id: 'cat-1', name: 'Main Course' }]);
    });
  });

  // ── Response interceptor: 401 refresh ─────────────────────────────────────

  describe('response interceptor - 401 refresh', () => {
    it('refreshes the token and retries the original request on 401', async () => {
      // Simulate storage
      const store: Record<string, string> = {
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
      };
      getSecureStore.mockImplementation((key: string) => Promise.resolve(store[key] ?? null));
      setSecureStore.mockImplementation((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      });

      let callCount = 0;
      mswServer.use(
        http.get(`${BASE}/orders`, () => {
          callCount++;
          if (callCount === 1) return fail('Unauthorized', 401);
          return ok({ orders: [], meta: {} });
        }),
        http.post(`${BASE}/auth/refresh`, () =>
          ok({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresIn: 604800,
          }),
        ),
      );

      const result = await apiClient.get('/orders');

      expect(callCount).toBe(2);
      expect(store['accessToken']).toBe('new-access-token');
      expect(store['refreshToken']).toBe('new-refresh-token');
      expect(result).toMatchObject({ orders: [] });
    });

    it('clears tokens and rejects when there is no refresh token', async () => {
      getSecureStore.mockResolvedValue(null); // no tokens at all

      mswServer.use(http.get(`${BASE}/orders`, () => fail('Unauthorized', 401)));

      await expect(apiClient.get('/orders')).rejects.toThrow();

      expect(delSecureStore).toHaveBeenCalledWith('accessToken');
      expect(delSecureStore).toHaveBeenCalledWith('refreshToken');
    });
  });

  // ── Response interceptor: error normalization ─────────────────────────────

  describe('response interceptor - error normalization', () => {
    it('extracts the message from the error response body', async () => {
      mswServer.use(
        http.post(`${BASE}/auth/send-otp`, () =>
          fail('Please wait before requesting another OTP.', 429),
        ),
      );

      await expect(apiClient.post('/auth/send-otp', { phone: '9876543210' })).rejects.toThrow(
        'Please wait before requesting another OTP.',
      );
    });

    it('falls back to a generic message when the response has no message field', async () => {
      mswServer.use(http.get(`${BASE}/cart`, () => HttpResponse.json({}, { status: 500 })));

      await expect(apiClient.get('/cart')).rejects.toThrow();
    });
  });
});
