import type {
  Expense,
  ExpenseWithUser,
  ExpenseSummary,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  DEFAULT_CATEGORIES,
} from '../../../shared/src';
import { generateId, getCurrentTimestamp } from '../utils';

export class ExpenseService {
  constructor(private db: D1Database) {}

  async create(userId: string, familyId: string, data: CreateExpenseRequest): Promise<Expense> {
    const id = generateId();
    const timestamp = getCurrentTimestamp();

    await this.db
      .prepare(
        `INSERT INTO expenses (id, family_id, user_id, amount, name, category, place, photo, purchase_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        familyId,
        userId,
        data.amount,
        data.name,
        data.category,
        data.place || null,
        data.photo || null,
        data.purchase_date,
        timestamp,
        timestamp
      )
      .run();

    const expense = await this.getById(id, familyId);
    if (!expense) throw new Error('Failed to create expense');
    return expense;
  }

  async getById(id: string, familyId: string): Promise<Expense | null> {
    return this.db
      .prepare('SELECT * FROM expenses WHERE id = ? AND family_id = ?')
      .bind(id, familyId)
      .first<Expense>();
  }

  async getByIdWithUser(id: string, familyId: string): Promise<ExpenseWithUser | null> {
    return this.db
      .prepare(
        `SELECT e.*, u.display_name as user_display_name, u.email as user_email
         FROM expenses e
         JOIN users u ON e.user_id = u.id
         WHERE e.id = ? AND e.family_id = ?`
      )
      .bind(id, familyId)
      .first<ExpenseWithUser>();
  }

  async list(familyId: string, filters: ExpenseFilters): Promise<{ expenses: ExpenseWithUser[]; total: number }> {
    const conditions: string[] = ['e.family_id = ?'];
    const params: (string | number)[] = [familyId];

    if (filters.category) {
      conditions.push('e.category = ?');
      params.push(filters.category);
    }

    if (filters.user_id) {
      conditions.push('e.user_id = ?');
      params.push(filters.user_id);
    }

    if (filters.start_date) {
      conditions.push('e.purchase_date >= ?');
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      conditions.push('e.purchase_date <= ?');
      params.push(filters.end_date);
    }

    const whereClause = conditions.join(' AND ');
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM expenses e WHERE ${whereClause}`)
      .bind(...params)
      .first<{ total: number }>();

    // Get paginated results
    const result = await this.db
      .prepare(
        `SELECT e.*, u.display_name as user_display_name, u.email as user_email
         FROM expenses e
         JOIN users u ON e.user_id = u.id
         WHERE ${whereClause}
         ORDER BY e.purchase_date DESC, e.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all<ExpenseWithUser>();

    return {
      expenses: result.results,
      total: countResult?.total || 0,
    };
  }

  async update(id: string, familyId: string, data: UpdateExpenseRequest): Promise<Expense> {
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.amount !== undefined) {
      updates.push('amount = ?');
      values.push(data.amount);
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      values.push(data.category);
    }
    if (data.place !== undefined) {
      updates.push('place = ?');
      values.push(data.place);
    }
    if (data.photo !== undefined) {
      updates.push('photo = ?');
      values.push(data.photo);
    }
    if (data.purchase_date !== undefined) {
      updates.push('purchase_date = ?');
      values.push(data.purchase_date);
    }

    if (updates.length === 0) {
      const expense = await this.getById(id, familyId);
      if (!expense) throw new Error('Expense not found');
      return expense;
    }

    updates.push('updated_at = ?');
    values.push(getCurrentTimestamp());
    values.push(id);
    values.push(familyId);

    await this.db
      .prepare(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ? AND family_id = ?`)
      .bind(...values)
      .run();

    const expense = await this.getById(id, familyId);
    if (!expense) throw new Error('Expense not found');
    return expense;
  }

  async delete(id: string, familyId: string): Promise<void> {
    const result = await this.db
      .prepare('DELETE FROM expenses WHERE id = ? AND family_id = ?')
      .bind(id, familyId)
      .run();

    if (result.meta.changes === 0) {
      throw new Error('Expense not found');
    }
  }

  async getSummary(familyId: string, startDate?: string, endDate?: string): Promise<ExpenseSummary> {
    const dateCondition = startDate && endDate
      ? 'AND purchase_date BETWEEN ? AND ?'
      : startDate
        ? 'AND purchase_date >= ?'
        : endDate
          ? 'AND purchase_date <= ?'
          : '';

    const dateParams = startDate && endDate
      ? [startDate, endDate]
      : startDate
        ? [startDate]
        : endDate
          ? [endDate]
          : [];

    // Total amount and count
    const totals = await this.db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total_amount, COUNT(*) as expense_count
         FROM expenses WHERE family_id = ? ${dateCondition}`
      )
      .bind(familyId, ...dateParams)
      .first<{ total_amount: number; expense_count: number }>();

    // Category breakdown
    const categoryResult = await this.db
      .prepare(
        `SELECT category, SUM(amount) as total, COUNT(*) as count
         FROM expenses WHERE family_id = ? ${dateCondition}
         GROUP BY category
         ORDER BY total DESC`
      )
      .bind(familyId, ...dateParams)
      .all<{ category: string; total: number; count: number }>();

    // Monthly totals (last 12 months)
    const monthlyResult = await this.db
      .prepare(
        `SELECT strftime('%Y-%m', purchase_date) as month, SUM(amount) as total
         FROM expenses
         WHERE family_id = ? AND purchase_date >= date('now', '-12 months')
         GROUP BY month
         ORDER BY month ASC`
      )
      .bind(familyId)
      .all<{ month: string; total: number }>();

    // Recent expenses
    const recentResult = await this.db
      .prepare(
        `SELECT e.*, u.display_name as user_display_name, u.email as user_email
         FROM expenses e
         JOIN users u ON e.user_id = u.id
         WHERE e.family_id = ?
         ORDER BY e.purchase_date DESC, e.created_at DESC
         LIMIT 5`
      )
      .bind(familyId)
      .all<ExpenseWithUser>();

    return {
      total_amount: totals?.total_amount || 0,
      expense_count: totals?.expense_count || 0,
      category_breakdown: categoryResult.results,
      monthly_totals: monthlyResult.results,
      recent_expenses: recentResult.results,
    };
  }

  async getCategories(): Promise<string[]> {
    // Return default categories
    return [
      'Food & Groceries',
      'Transportation',
      'Utilities',
      'Entertainment',
      'Shopping',
      'Healthcare',
      'Education',
      'Housing',
      'Insurance',
      'Personal Care',
      'Gifts & Donations',
      'Travel',
      'Other',
    ];
  }
}
