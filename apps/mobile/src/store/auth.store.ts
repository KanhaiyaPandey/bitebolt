import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

interface AuthUser {
  id: string;
  phone: string;
  name: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRegistered: boolean; // Has the user completed registration (name set)

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isRegistered: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('userId', user.id);
    await SecureStore.setItemAsync('isRegistered', user.name ? '1' : '0');

    set({
      user,
      isAuthenticated: true,
      isRegistered: !!user.name,
    });
  },

  setUser: (userData) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...userData };
    set({
      user: updated,
      isRegistered: !!updated.name,
    });
    if (updated.name) {
      SecureStore.setItemAsync('isRegistered', '1');
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('isRegistered');
    set({ user: null, isAuthenticated: false, isRegistered: false });
  },

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const registered = await SecureStore.getItemAsync('isRegistered');
      set({ isAuthenticated: true, isRegistered: registered === '1', isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
