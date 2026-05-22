import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.API_URL ?? 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request interceptor: attach access token ──────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle token refresh ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);

        originalRequest.headers!.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — clear tokens and redirect to login
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        // The auth store's subscriber will handle navigation
        return Promise.reject(error);
      }
    }

    const message =
      (error.response?.data as Record<string, unknown>)?.message ?? error.message ?? 'Something went wrong';
    return Promise.reject(new Error(message as string));
  },
);

export default apiClient;
