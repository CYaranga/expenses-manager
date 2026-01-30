import type { User, AuthTokens } from '../../../shared/src';
import type { Env } from '../types';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
  generateId,
  getCurrentTimestamp,
  verifyGoogleToken,
} from '../utils';

export class AuthService {
  constructor(
    private db: D1Database,
    private jwtSecret: string,
    private googleClientId: string
  ) {}

  async googleSignIn(credential: string): Promise<{ user: User; tokens: AuthTokens }> {
    const googlePayload = await verifyGoogleToken(credential, this.googleClientId);

    // Try to find existing user by google_id
    let user = await this.db
      .prepare('SELECT * FROM users WHERE google_id = ?')
      .bind(googlePayload.sub)
      .first<User>();

    if (!user) {
      // Try to find by email (for migrating existing email/password users)
      user = await this.db
        .prepare('SELECT * FROM users WHERE email = ?')
        .bind(googlePayload.email.toLowerCase())
        .first<User>();

      if (user) {
        // Link Google account to existing user
        const timestamp = getCurrentTimestamp();
        await this.db
          .prepare('UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?), display_name = COALESCE(display_name, ?), updated_at = ?, last_login_at = ? WHERE id = ?')
          .bind(googlePayload.sub, googlePayload.picture || null, googlePayload.name || null, timestamp, timestamp, user.id)
          .run();

        user = await this.db
          .prepare('SELECT * FROM users WHERE id = ?')
          .bind(user.id)
          .first<User>();
      } else {
        // Create new user
        const userId = generateId();
        const timestamp = getCurrentTimestamp();

        await this.db
          .prepare(
            `INSERT INTO users (id, email, google_id, display_name, avatar_url, role, created_at, updated_at, last_login_at)
             VALUES (?, ?, ?, ?, ?, 'member', ?, ?, ?)`
          )
          .bind(
            userId,
            googlePayload.email.toLowerCase(),
            googlePayload.sub,
            googlePayload.name || null,
            googlePayload.picture || null,
            timestamp,
            timestamp,
            timestamp
          )
          .run();

        user = await this.db
          .prepare('SELECT * FROM users WHERE id = ?')
          .bind(userId)
          .first<User>();
      }
    } else {
      // Update last login
      const timestamp = getCurrentTimestamp();
      await this.db
        .prepare('UPDATE users SET last_login_at = ?, avatar_url = COALESCE(avatar_url, ?), updated_at = ? WHERE id = ?')
        .bind(timestamp, googlePayload.picture || null, timestamp, user.id)
        .run();
    }

    if (!user) {
      throw new Error('Failed to create or find user');
    }

    const tokens = await this.generateTokens(user);
    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = await hashToken(refreshToken);

    const storedToken = await this.db
      .prepare(
        `SELECT rt.*, u.email
         FROM refresh_tokens rt
         JOIN users u ON rt.user_id = u.id
         WHERE rt.token_hash = ? AND rt.expires_at > datetime('now')`
      )
      .bind(tokenHash)
      .first<{ user_id: string; email: string }>();

    if (!storedToken) {
      throw new Error('Invalid or expired refresh token');
    }

    // Delete the used refresh token
    await this.db
      .prepare('DELETE FROM refresh_tokens WHERE token_hash = ?')
      .bind(tokenHash)
      .run();

    const user = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(storedToken.user_id)
      .first<User>();

    if (!user) {
      throw new Error('User not found');
    }

    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = await hashToken(refreshToken);

    await this.db
      .prepare('DELETE FROM refresh_tokens WHERE token_hash = ?')
      .bind(tokenHash)
      .run();
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { userId: user.id, email: user.email };

    const accessToken = await generateAccessToken(payload, this.jwtSecret);
    const refreshToken = await generateRefreshToken(payload, this.jwtSecret);

    // Store refresh token hash
    const tokenHash = await hashToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry().toISOString();

    await this.db
      .prepare(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(generateId(), user.id, tokenHash, expiresAt, getCurrentTimestamp())
      .run();

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900,
    };
  }
}
