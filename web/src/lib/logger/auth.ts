import type { LoginResponse } from '@expenses-manager/shared';
import { loggerConfig, LOGGER_TOKEN_KEY, LOGGER_TOKEN_EXPIRY_KEY } from './config';

class LoggerAuthManager {
  private authPromise: Promise<string | null> | null = null;

  async getToken(): Promise<string | null> {
    // Check for existing valid token
    const token = localStorage.getItem(LOGGER_TOKEN_KEY);
    const expiry = localStorage.getItem(LOGGER_TOKEN_EXPIRY_KEY);

    if (token && expiry) {
      const expiryDate = new Date(expiry);
      // Refresh if expiring in less than 1 hour
      if (expiryDate.getTime() - Date.now() > 60 * 60 * 1000) {
        return token;
      }
    }

    // If already authenticating, wait for that promise
    if (this.authPromise) {
      return this.authPromise;
    }

    // Authenticate
    this.authPromise = this.authenticate();
    const newToken = await this.authPromise;
    this.authPromise = null;

    return newToken;
  }

  private async authenticate(): Promise<string | null> {
    if (!loggerConfig.username || !loggerConfig.password) {
      console.warn('Logger credentials not configured');
      return null;
    }

    try {
      const response = await fetch(`${loggerConfig.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: loggerConfig.username,
          password: loggerConfig.password,
        }),
      });

      if (!response.ok) {
        console.error('Logger authentication failed:', response.status);
        return null;
      }

      const data: LoginResponse = await response.json();

      // Store token and expiry
      localStorage.setItem(LOGGER_TOKEN_KEY, data.token);
      localStorage.setItem(LOGGER_TOKEN_EXPIRY_KEY, data.expiresAt);

      return data.token;
    } catch (error) {
      console.error('Logger authentication error:', error);
      return null;
    }
  }

  clearToken(): void {
    localStorage.removeItem(LOGGER_TOKEN_KEY);
    localStorage.removeItem(LOGGER_TOKEN_EXPIRY_KEY);
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${loggerConfig.apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logger logout error:', error);
    } finally {
      this.clearToken();
    }
  }
}

export const loggerAuth = new LoggerAuthManager();
