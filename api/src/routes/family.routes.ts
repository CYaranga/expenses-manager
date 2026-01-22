import { Hono } from 'hono';
import { z } from 'zod';
import type { HonoEnv } from '../types';
import { FamilyService } from '../services/family.service';
import { authMiddleware, requireFamily, requireAdmin } from '../middleware/auth';

const createFamilySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).optional(),
});

const updateFamilySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).optional(),
});

const joinFamilySchema = z.object({
  invite_code: z.string().min(1),
});

export const familyRoutes = new Hono<HonoEnv>();

// All family routes require authentication
familyRoutes.use('/*', authMiddleware);

familyRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');

    if (user.family_id) {
      return c.json({ success: false, error: 'You are already a member of a family' }, 400);
    }

    const body = await c.req.json();
    const data = createFamilySchema.parse(body);

    const familyService = new FamilyService(c.env.DB);
    const family = await familyService.create(user.id, data);

    return c.json({ success: true, data: { family } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create family';
    return c.json({ success: false, error: message }, 400);
  }
});

familyRoutes.get('/current', requireFamily, async (c) => {
  try {
    const user = c.get('user');
    const familyService = new FamilyService(c.env.DB);
    const family = await familyService.getById(user.family_id!);

    if (!family) {
      return c.json({ success: false, error: 'Family not found' }, 404);
    }

    return c.json({ success: true, data: { family } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get family';
    return c.json({ success: false, error: message }, 400);
  }
});

familyRoutes.put('/current', requireFamily, requireAdmin, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = updateFamilySchema.parse(body);

    const familyService = new FamilyService(c.env.DB);
    const family = await familyService.update(user.family_id!, data);

    return c.json({ success: true, data: { family } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update family';
    return c.json({ success: false, error: message }, 400);
  }
});

familyRoutes.get('/members', requireFamily, async (c) => {
  try {
    const user = c.get('user');
    const familyService = new FamilyService(c.env.DB);
    const members = await familyService.getMembers(user.family_id!);

    return c.json({ success: true, data: { members } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get members';
    return c.json({ success: false, error: message }, 400);
  }
});

familyRoutes.post('/join', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = joinFamilySchema.parse(body);

    const familyService = new FamilyService(c.env.DB);
    const family = await familyService.joinByInviteCode(user.id, data.invite_code);

    return c.json({ success: true, data: { family } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to join family';
    return c.json({ success: false, error: message }, 400);
  }
});

familyRoutes.post('/regenerate-code', requireFamily, requireAdmin, async (c) => {
  try {
    const user = c.get('user');
    const familyService = new FamilyService(c.env.DB);
    const invite_code = await familyService.regenerateInviteCode(user.family_id!);

    return c.json({ success: true, data: { invite_code } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate code';
    return c.json({ success: false, error: message }, 400);
  }
});

familyRoutes.post('/leave', requireFamily, async (c) => {
  try {
    const user = c.get('user');
    const familyService = new FamilyService(c.env.DB);
    await familyService.leaveFamily(user.id);

    return c.json({ success: true, message: 'Left family successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to leave family';
    return c.json({ success: false, error: message }, 400);
  }
});
