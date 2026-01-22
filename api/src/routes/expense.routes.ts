import { Hono } from 'hono';
import { z } from 'zod';
import type { HonoEnv } from '../types';
import { ExpenseService } from '../services/expense.service';
import { authMiddleware, requireFamily } from '../middleware/auth';

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  name: z.string().min(1).max(200),
  category: z.string().min(1),
  place: z.string().max(200).optional(),
  photo: z.string().url().optional(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).optional(),
  place: z.string().max(200).optional().nullable(),
  photo: z.string().url().optional().nullable(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const expenseRoutes = new Hono<HonoEnv>();

// All expense routes require authentication and family membership
expenseRoutes.use('/*', authMiddleware, requireFamily);

expenseRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();

    const filters = {
      category: query.category,
      user_id: query.user_id,
      start_date: query.start_date,
      end_date: query.end_date,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
    };

    const expenseService = new ExpenseService(c.env.DB);
    const { expenses, total } = await expenseService.list(user.family_id!, filters);

    return c.json({
      success: true,
      data: { expenses, total, limit: filters.limit || 50, offset: filters.offset || 0 },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list expenses';
    return c.json({ success: false, error: message }, 400);
  }
});

expenseRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = createExpenseSchema.parse(body);

    const expenseService = new ExpenseService(c.env.DB);
    const expense = await expenseService.create(user.id, user.family_id!, data);

    return c.json({ success: true, data: { expense } }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create expense';
    return c.json({ success: false, error: message }, 400);
  }
});

expenseRoutes.get('/summary', async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();

    const expenseService = new ExpenseService(c.env.DB);
    const summary = await expenseService.getSummary(
      user.family_id!,
      query.start_date,
      query.end_date
    );

    return c.json({ success: true, data: { summary } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get summary';
    return c.json({ success: false, error: message }, 400);
  }
});

expenseRoutes.get('/categories', async (c) => {
  try {
    const expenseService = new ExpenseService(c.env.DB);
    const categories = await expenseService.getCategories();

    return c.json({ success: true, data: { categories } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get categories';
    return c.json({ success: false, error: message }, 400);
  }
});

expenseRoutes.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const expenseService = new ExpenseService(c.env.DB);
    const expense = await expenseService.getByIdWithUser(id, user.family_id!);

    if (!expense) {
      return c.json({ success: false, error: 'Expense not found' }, 404);
    }

    return c.json({ success: true, data: { expense } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get expense';
    return c.json({ success: false, error: message }, 400);
  }
});

expenseRoutes.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const body = await c.req.json();
    const data = updateExpenseSchema.parse(body);

    const expenseService = new ExpenseService(c.env.DB);

    // Check if expense exists and user can edit
    const existing = await expenseService.getById(id, user.family_id!);
    if (!existing) {
      return c.json({ success: false, error: 'Expense not found' }, 404);
    }

    // Only allow edit if user owns the expense or is admin
    if (existing.user_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: 'Not authorized to edit this expense' }, 403);
    }

    const expense = await expenseService.update(id, user.family_id!, data);

    return c.json({ success: true, data: { expense } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update expense';
    return c.json({ success: false, error: message }, 400);
  }
});

expenseRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const expenseService = new ExpenseService(c.env.DB);

    // Check if expense exists and user can delete
    const existing = await expenseService.getById(id, user.family_id!);
    if (!existing) {
      return c.json({ success: false, error: 'Expense not found' }, 404);
    }

    // Only allow delete if user owns the expense or is admin
    if (existing.user_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: 'Not authorized to delete this expense' }, 403);
    }

    await expenseService.delete(id, user.family_id!);

    return c.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete expense';
    return c.json({ success: false, error: message }, 400);
  }
});
