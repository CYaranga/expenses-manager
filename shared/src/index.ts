// User types
export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  avatar_url: string | null;
  family_id: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserPublic {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  family_id: string | null;
  role: UserRole;
  created_at: string;
}

// Family types
export interface Family {
  id: string;
  name: string;
  invite_code: string;
  admin_id: string;
  description: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

// Expense types
export interface Expense {
  id: string;
  family_id: string;
  user_id: string;
  amount: number;
  name: string;
  category: string;
  place: string | null;
  photo: string | null;
  purchase_date: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithUser extends Expense {
  user_display_name: string | null;
  user_email: string;
}

export interface ExpenseSummary {
  total_amount: number;
  expense_count: number;
  category_breakdown: {
    category: string;
    total: number;
    count: number;
  }[];
  monthly_totals: {
    month: string;
    total: number;
  }[];
  recent_expenses: ExpenseWithUser[];
}

// Auth types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

// API Request/Response types
export interface RegisterRequest {
  email: string;
  password: string;
  display_name?: string;
  family_action: 'create' | 'join';
  family_name?: string;
  invite_code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateFamilyRequest {
  name: string;
  description?: string;
  currency?: string;
}

export interface UpdateFamilyRequest {
  name?: string;
  description?: string;
  currency?: string;
}

export interface JoinFamilyRequest {
  invite_code: string;
}

export interface CreateExpenseRequest {
  amount: number;
  name: string;
  category: string;
  place?: string;
  photo?: string;
  purchase_date: string;
}

export interface UpdateExpenseRequest {
  amount?: number;
  name?: string;
  category?: string;
  place?: string | null;
  photo?: string | null;
  purchase_date?: string;
}

export interface ExpenseFilters {
  category?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Default expense categories
export const DEFAULT_CATEGORIES = [
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
  'Other'
] as const;

export type ExpenseCategory = (typeof DEFAULT_CATEGORIES)[number];
