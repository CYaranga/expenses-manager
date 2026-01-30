import { create } from 'zustand';
import type { UserPublic } from '../../../shared/src';
import { authApi, setTokens, loadTokens, getAccessToken } from '../lib/api';
import { logger, LogCategories } from '../lib/logger';

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  googleSignIn: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  googleSignIn: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      logger.client.info('Google sign-in initiated', LogCategories.AUTH);
      const response = await authApi.googleSignIn(credential);
      setTokens(response.tokens);

      // Initialize logger with user ID
      logger.initialize(response.user.id);

      logger.client.info('Google sign-in successful', LogCategories.AUTH, {
        userId: response.user.id,
        email: response.user.email,
      });

      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      logger.error.logAuthError('google-sign-in', err, { message });
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      logger.client.info('Logout initiated', LogCategories.AUTH);
      await authApi.logout();
    } catch (err) {
      logger.error.logAuthError('logout', err);
    }
    setTokens(null);
    logger.initialize(null);
    logger.client.info('Logout successful', LogCategories.AUTH);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    loadTokens();
    const token = getAccessToken();

    if (!token) {
      logger.client.debug('No auth token found', LogCategories.AUTH);
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await authApi.me();
      // Initialize logger with user ID
      logger.initialize(response.user.id);
      logger.client.info('Auth check successful', LogCategories.AUTH, {
        userId: response.user.id,
      });
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      logger.error.logAuthError('check-auth', err);
      setTokens(null);
      logger.initialize(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
