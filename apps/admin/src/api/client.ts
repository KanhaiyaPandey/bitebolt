import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const client = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'X-Client': 'admin',
  },
});

// Attach auth token to every request
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('adminAccessToken');
  console.debug(`[AdminAPI] ${config.method?.toUpperCase()} ${config.url}`);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

client.interceptors.response.use(
  (response) => {
    console.debug(`[AdminAPI] Response ${response.status}`, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    console.error(`[AdminAPI] Error ${status}`, error.config?.url, error.message);

    if (status === 401 && !originalRequest._retry && !originalRequest.url?.startsWith('/auth/')) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(client(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('adminRefreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'X-Client': 'admin' } },
        );
        const { accessToken } = res.data.data ?? res.data;

        await SecureStore.setItemAsync('adminAccessToken', accessToken);
        console.debug('[AdminAPI] Token refreshed');

        refreshQueue.forEach((cb) => cb(accessToken));
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch {
        console.error('[AdminAPI] Token refresh failed — logging out');
        await SecureStore.deleteItemAsync('adminAccessToken');
        await SecureStore.deleteItemAsync('adminRefreshToken');
        refreshQueue = [];
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.message ?? error.message ?? 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  },
);

export { client };
