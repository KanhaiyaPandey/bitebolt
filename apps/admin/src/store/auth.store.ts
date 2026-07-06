import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

interface AdminUser {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initialize: () => Promise<void>;
  setAuth: (user: AdminUser, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    console.debug('[AdminAuth] Initializing session');
    try {
      const token = await SecureStore.getItemAsync('adminAccessToken');
      const userJson = await SecureStore.getItemAsync('adminUser');
      if (token && userJson) {
        const user = JSON.parse(userJson) as AdminUser;
        console.debug('[AdminAuth] Session restored', { userId: user.id });
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        console.debug('[AdminAuth] No persisted session');
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('[AdminAuth] Session restore error', e);
      // Clear any partial/stale auth so the client can't keep authenticating
      // with a token the store no longer trusts.
      try {
        await SecureStore.deleteItemAsync('adminAccessToken');
        await SecureStore.deleteItemAsync('adminRefreshToken');
        await SecureStore.deleteItemAsync('adminUser');
      } catch (cleanupError) {
        console.error('[AdminAuth] Session cleanup error', cleanupError);
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setAuth: async (user, accessToken, refreshToken) => {
    console.debug('[AdminAuth] Setting auth', { userId: user.id });
    await SecureStore.setItemAsync('adminAccessToken', accessToken);
    await SecureStore.setItemAsync('adminRefreshToken', refreshToken);
    await SecureStore.setItemAsync('adminUser', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    console.debug('[AdminAuth] Logout');
    try {
      await SecureStore.deleteItemAsync('adminAccessToken');
      await SecureStore.deleteItemAsync('adminRefreshToken');
      await SecureStore.deleteItemAsync('adminUser');
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },
}));
