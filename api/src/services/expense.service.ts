import type {
  Expense,
  ExpenseWithUser,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  DailyTotal,
  PeriodSummary,
  TransactionType,
} from '../../../shared/src';
import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../../../shared/src';
import { generateId, getCurrentTimestamp } from '../utils';

export class ExpenseService {
  constructor(private db: D1Database) {}

  async create(userId: string, familyId: string, data: CreateExpenseRequest): Promise<Expense> {
    const id = generateId();
    const timestamp = getCurrentTimestamp();
    const type = data.type || 'expense';

    await this.db
      .prepare(
        `INSERT INTO expenses (id, family_id, user_id, amount, name, category, type, place, photo, purchase_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        familyId,
        userId,
        data.amount,
        data.name,
        data.category,
        type,
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

    if (filters.type) {
      conditions.push('e.type = ?');
      params.push(filters.type);
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
    if (data.type !== undefined) {
      updates.push('type = ?');
      values.push(data.type);
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

  async getDailyTotals(familyId: string, year: number): Promise<DailyTotal[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const result = await this.db
      .prepare(
        `SELECT purchase_date as date,
                SUM(CASE WHEN type = 'income' THEN -amount ELSE amount END) as total
         FROM expenses
         WHERE family_id = ? AND purchase_date BETWEEN ? AND ?
         GROUP BY purchase_date`
      )
      .bind(familyId, startDate, endDate)
      .all<DailyTotal>();

    return result.results;
  }

  async getSummary(familyId: string, startDate: string, endDate: string): Promise<PeriodSummary> {
    const totalsResult = await this.db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
           COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
           COUNT(*) as transaction_count
         FROM expenses
         WHERE family_id = ? AND purchase_date BETWEEN ? AND ?`
      )
      .bind(familyId, startDate, endDate)
      .first<{ total_expenses: number; total_income: number; transaction_count: number }>();

    const topCategoryResult = await this.db
      .prepare(
        `SELECT category, SUM(amount) as cat_total
         FROM expenses
         WHERE family_id = ? AND type = 'expense' AND purchase_date BETWEEN ? AND ?
         GROUP BY category
         ORDER BY cat_total DESC
         LIMIT 1`
      )
      .bind(familyId, startDate, endDate)
      .first<{ category: string; cat_total: number }>();

    const totalExpenses = totalsResult?.total_expenses || 0;
    const totalIncome = totalsResult?.total_income || 0;

    return {
      total_expenses: totalExpenses,
      total_income: totalIncome,
      net_balance: totalIncome - totalExpenses,
      top_category: topCategoryResult?.category || null,
      top_category_amount: topCategoryResult?.cat_total || 0,
      transaction_count: totalsResult?.transaction_count || 0,
    };
  }

  async getCategories(type?: TransactionType): Promise<string[]> {
    if (type === 'income') {
      return [...DEFAULT_INCOME_CATEGORIES];
    }
    return [...DEFAULT_CATEGORIES];
  }
}
