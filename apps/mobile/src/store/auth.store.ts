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
  isRegistered: boolean;

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

const USER_KEY = 'user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isRegistered: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await Promise.all([
      SecureStore.setItemAsync('accessToken', accessToken),
      SecureStore.setItemAsync('refreshToken', refreshToken),
      SecureStore.setItemAsync('userId', user.id),
      SecureStore.setItemAsync('isRegistered', user.name ? '1' : '0'),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);

    set({ user, isAuthenticated: true, isRegistered: !!user.name });

    // Merge any guest cart items into the server cart after login
    try {
      const { useGuestCartStore } = await import('./guest-cart.store');
      const { cartApi } = await import('../api');
      const guestItems = useGuestCartStore.getState().items;
      if (guestItems.length > 0) {
        await Promise.allSettled(
          guestItems.map((item) =>
            cartApi.addItem({ foodItemId: item.foodItemId, quantity: item.quantity }),
          ),
        );
        await useGuestCartStore.getState().clear();
      }
    } catch {
      // Non-critical — cart merge failure should not block login
    }
  },

  setUser: (userData) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...userData };
    set({ user: updated, isRegistered: !!updated.name });
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
    if (updated.name) SecureStore.setItemAsync('isRegistered', '1');
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken'),
      SecureStore.deleteItemAsync('userId'),
      SecureStore.deleteItemAsync('isRegistered'),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ user: null, isAuthenticated: false, isRegistered: false });
  },

  initialize: async () => {
    try {
      const [token, storedUser, registered] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync('isRegistered'),
      ]);

      if (!token) {
        set({ isLoading: false });
        return;
      }

      // Restore user immediately from cache so UI isn't blank
      if (storedUser) {
        const user: AuthUser = JSON.parse(storedUser);
        set({ user, isAuthenticated: true, isRegistered: !!user.name, isLoading: false });
      } else {
        set({ isAuthenticated: true, isRegistered: registered === '1', isLoading: false });
      }

      // Silently refresh profile from API in the background
      try {
        const { usersApi } = await import('../api');
        const profile = await usersApi.getProfile();
        const refreshed: AuthUser = {
          id: profile.id,
          phone: profile.phone,
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          role: profile.role,
        };
        set({ user: refreshed, isRegistered: !!refreshed.name });
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(refreshed));
      } catch {
        // Background refresh failed (expired token etc.) — force re-login
        await Promise.all([
          SecureStore.deleteItemAsync('accessToken'),
          SecureStore.deleteItemAsync('refreshToken'),
          SecureStore.deleteItemAsync('userId'),
          SecureStore.deleteItemAsync('isRegistered'),
          SecureStore.deleteItemAsync(USER_KEY),
        ]);
        set({ user: null, isAuthenticated: false, isRegistered: false, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
