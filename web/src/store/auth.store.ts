import { create } from 'zustand';
import type { UserPublic, RegisterRequest, LoginRequest } from '../../../shared/src';
import { authApi, setTokens, loadTokens, getAccessToken } from '../lib/api';

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(data);
      setTokens(response.tokens);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      setTokens(response.tokens);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    setTokens(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    loadTokens();
    const token = getAccessToken();

    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await authApi.me();
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch {
      setTokens(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
