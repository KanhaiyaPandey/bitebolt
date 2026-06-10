import * as SecureStore from 'expo-secure-store';

import { useAuthStore } from '../../store/auth.store';

const getSecureStore = SecureStore.getItemAsync as jest.Mock;
const setSecureStore = SecureStore.setItemAsync as jest.Mock;
const delSecureStore = SecureStore.deleteItemAsync as jest.Mock;

const testUser = {
  id: 'user-1',
  phone: '9876543210',
  name: 'Test User',
  email: 'test@example.com',
  role: 'CUSTOMER',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isRegistered: false,
    });
  });

  // ── setAuth ───────────────────────────────────────────────────────────────

  describe('setAuth', () => {
    it('saves tokens + userId to SecureStore and updates state', async () => {
      setSecureStore.mockResolvedValue(undefined);

      await useAuthStore.getState().setAuth(testUser, 'access-token', 'refresh-token');

      expect(setSecureStore).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(setSecureStore).toHaveBeenCalledWith('refreshToken', 'refresh-token');
      expect(setSecureStore).toHaveBeenCalledWith('userId', 'user-1');

      const { user, isAuthenticated, isRegistered } = useAuthStore.getState();
      expect(isAuthenticated).toBe(true);
      expect(user?.id).toBe('user-1');
      expect(isRegistered).toBe(true); // user has a name
    });

    it('sets isRegistered=false when user has no name', async () => {
      setSecureStore.mockResolvedValue(undefined);

      await useAuthStore
        .getState()
        .setAuth({ ...testUser, name: null }, 'access-token', 'refresh-token');

      expect(useAuthStore.getState().isRegistered).toBe(false);
    });
  });

  // ── setUser ───────────────────────────────────────────────────────────────

  describe('setUser', () => {
    it('merges partial user data into the current user state', async () => {
      setSecureStore.mockResolvedValue(undefined);
      await useAuthStore.getState().setAuth(testUser, 'at', 'rt');

      useAuthStore.getState().setUser({ name: 'Updated Name', email: 'new@example.com' });

      const { user, isRegistered } = useAuthStore.getState();
      expect(user?.name).toBe('Updated Name');
      expect(user?.email).toBe('new@example.com');
      expect(user?.phone).toBe('9876543210'); // unchanged
      expect(isRegistered).toBe(true);
    });

    it('does nothing when the user is not authenticated', () => {
      useAuthStore.getState().setUser({ name: 'Ghost' });

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears all SecureStore keys and resets state', async () => {
      setSecureStore.mockResolvedValue(undefined);
      delSecureStore.mockResolvedValue(undefined);

      await useAuthStore.getState().setAuth(testUser, 'at', 'rt');
      await useAuthStore.getState().logout();

      expect(delSecureStore).toHaveBeenCalledWith('accessToken');
      expect(delSecureStore).toHaveBeenCalledWith('refreshToken');
      expect(delSecureStore).toHaveBeenCalledWith('userId');
      expect(delSecureStore).toHaveBeenCalledWith('isRegistered');

      const { user, isAuthenticated, isRegistered } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
      expect(isRegistered).toBe(false);
    });
  });

  // ── initialize ────────────────────────────────────────────────────────────

  describe('initialize', () => {
    it('sets isAuthenticated=true and isLoading=false when tokens exist', async () => {
      getSecureStore.mockImplementation((key: string) => {
        if (key === 'accessToken') return Promise.resolve('existing-token');
        if (key === 'isRegistered') return Promise.resolve('1');
        return Promise.resolve(null);
      });

      await useAuthStore.getState().initialize();

      const { isAuthenticated, isRegistered, isLoading } = useAuthStore.getState();
      expect(isAuthenticated).toBe(true);
      expect(isRegistered).toBe(true);
      expect(isLoading).toBe(false);
    });

    it('sets isLoading=false and leaves isAuthenticated=false when no token', async () => {
      getSecureStore.mockResolvedValue(null);

      await useAuthStore.getState().initialize();

      const { isAuthenticated, isLoading } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
      expect(isLoading).toBe(false);
    });

    it('gracefully handles SecureStore errors', async () => {
      getSecureStore.mockRejectedValue(new Error('SecureStore unavailable'));

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
