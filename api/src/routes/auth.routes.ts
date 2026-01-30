import { Hono } from 'hono';
import { z } from 'zod';
import type { HonoEnv } from '../types';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth';
import type { UserPublic } from '../../../shared/src';

const googleSignInSchema = z.object({
  credential: z.string(),
});

const refreshSchema = z.object({
  refresh_token: z.string(),
});

export const authRoutes = new Hono<HonoEnv>();

authRoutes.post('/google', async (c) => {
  try {
    const body = await c.req.json();
    const data = googleSignInSchema.parse(body);

    const authService = new AuthService(c.env.DB, c.env.JWT_SECRET, c.env.GOOGLE_CLIENT_ID);
    const { user, tokens } = await authService.googleSignIn(data.credential);

    const userPublic: UserPublic = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      family_id: user.family_id,
      role: user.role,
      created_at: user.created_at,
    };

    return c.json({
      success: true,
      data: { user: userPublic, tokens },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google sign-in failed';
    return c.json({ success: false, error: message }, 401);
  }
});

authRoutes.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const data = refreshSchema.parse(body);

    const authService = new AuthService(c.env.DB, c.env.JWT_SECRET, c.env.GOOGLE_CLIENT_ID);
    const tokens = await authService.refresh(data.refresh_token);

    return c.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    return c.json({ success: false, error: message }, 401);
  }
});

authRoutes.post('/logout', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const data = refreshSchema.parse(body);

    const authService = new AuthService(c.env.DB, c.env.JWT_SECRET, c.env.GOOGLE_CLIENT_ID);
    await authService.logout(data.refresh_token);

    return c.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return c.json({ success: true, message: 'Logged out successfully' });
  }
});

authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');

  const userPublic: UserPublic = {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    family_id: user.family_id,
    role: user.role,
    created_at: user.created_at,
  };

  return c.json({
    success: true,
    data: { user: userPublic },
  });
});
