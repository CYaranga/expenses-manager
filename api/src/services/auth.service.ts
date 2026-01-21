import type { User, AuthTokens, RegisterRequest } from '../../../shared/src';
import type { Env } from '../types';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
  generateId,
  getCurrentTimestamp,
} from '../utils';
import { generateInviteCode } from '../utils/invite-code';

export class AuthService {
  constructor(private db: D1Database, private jwtSecret: string) {}

  async register(data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password, display_name, family_action, family_name, invite_code } = data;

    // Check if user exists
    const existingUser = await this.db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);
    const timestamp = getCurrentTimestamp();
    let familyId: string | null = null;
    let userRole: 'admin' | 'member' = 'member';

    if (family_action === 'create') {
      if (!family_name) {
        throw new Error('Family name is required when creating a family');
      }

      familyId = generateId();
      userRole = 'admin';
      const newInviteCode = generateInviteCode();

      await this.db
        .prepare(
          `INSERT INTO families (id, name, invite_code, admin_id, currency, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'USD', ?, ?)`
        )
        .bind(familyId, family_name, newInviteCode, userId, timestamp, timestamp)
        .run();
    } else if (family_action === 'join') {
      if (!invite_code) {
        throw new Error('Invite code is required when joining a family');
      }

      const family = await this.db
        .prepare('SELECT id FROM families WHERE invite_code = ?')
        .bind(invite_code.toUpperCase())
        .first<{ id: string }>();

      if (!family) {
        throw new Error('Invalid invite code');
      }

      familyId = family.id;
    }

    // Create user
    await this.db
      .prepare(
        `INSERT INTO users (id, email, password_hash, display_name, family_id, role, created_at, updated_at, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        userId,
        email.toLowerCase(),
        passwordHash,
        display_name || null,
        familyId,
        userRole,
        timestamp,
        timestamp,
        timestamp
      )
      .run();

    const user = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first<User>();

    if (!user) {
      throw new Error('Failed to create user');
    }

    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first<User>();

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await this.db
      .prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
      .bind(getCurrentTimestamp(), user.id)
      .run();

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
      expires_in: 900, // 15 minutes in seconds
    };
  }
}
