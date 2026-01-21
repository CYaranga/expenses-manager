import { Context, Next } from 'hono';
import type { HonoEnv } from '../types';
import { verifyToken } from '../utils/jwt';
import type { User } from '../../../shared/src';

export async function authMiddleware(c: Context<HonoEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token, c.env.JWT_SECRET);

  if (!payload || payload.type !== 'access') {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  // Fetch user from database
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(payload.userId).first<User>();

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 401);
  }

  c.set('user', user);
  c.set('userId', user.id);

  await next();
}

export async function requireFamily(c: Context<HonoEnv>, next: Next) {
  const user = c.get('user');

  if (!user.family_id) {
    return c.json({ success: false, error: 'You must be part of a family to access this resource' }, 403);
  }

  await next();
}

export async function requireAdmin(c: Context<HonoEnv>, next: Next) {
  const user = c.get('user');

  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin privileges required' }, 403);
  }

  await next();
}
