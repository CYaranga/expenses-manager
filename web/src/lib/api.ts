import type {
  ApiResponse,
  AuthTokens,
  UserPublic,
  Family,
  FamilyMember,
  Expense,
  ExpenseWithUser,
  ExpenseSummary,
  RegisterRequest,
  LoginRequest,
  CreateFamilyRequest,
  UpdateFamilyRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
} from '../../../shared/src';

const API_BASE = '/expenses-manager/api';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(tokens: AuthTokens | null) {
  if (tokens) {
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  } else {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

export function loadTokens() {
  accessToken = localStorage.getItem('access_token');
  refreshToken = localStorage.getItem('refresh_token');
}

export function getAccessToken() {
  return accessToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    // Try to refresh token if unauthorized
    if (response.status === 401 && refreshToken && endpoint !== '/auth/refresh') {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
        const retryData = (await retryResponse.json()) as ApiResponse<T>;
        if (retryResponse.ok && retryData.success) {
          return retryData.data as T;
        }
      }
    }
    throw new Error(data.error || 'Request failed');
  }

  return data.data as T;
}

async function tryRefreshToken(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = (await response.json()) as ApiResponse<{ tokens: AuthTokens }>;

    if (response.ok && data.success && data.data) {
      setTokens(data.data.tokens);
      return true;
    }
  } catch {
    // Refresh failed
  }

  setTokens(null);
  return false;
}

// Auth API
export const authApi = {
  register: (data: RegisterRequest) =>
    request<{ user: UserPublic; tokens: AuthTokens }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    request<{ user: UserPublic; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  me: () => request<{ user: UserPublic }>('/auth/me'),
};

// Family API
export const familyApi = {
  create: (data: CreateFamilyRequest) =>
    request<{ family: Family }>('/families', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrent: () => request<{ family: Family }>('/families/current'),

  update: (data: UpdateFamilyRequest) =>
    request<{ family: Family }>('/families/current', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getMembers: () => request<{ members: FamilyMember[] }>('/families/members'),

  join: (invite_code: string) =>
    request<{ family: Family }>('/families/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code }),
    }),

  regenerateCode: () =>
    request<{ invite_code: string }>('/families/regenerate-code', {
      method: 'POST',
    }),

  leave: () =>
    request<void>('/families/leave', {
      method: 'POST',
    }),
};

// Expense API
export const expenseApi = {
  list: (filters?: ExpenseFilters) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.user_id) params.set('user_id', filters.user_id);
    if (filters?.start_date) params.set('start_date', filters.start_date);
    if (filters?.end_date) params.set('end_date', filters.end_date);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const query = params.toString();
    return request<{
      expenses: ExpenseWithUser[];
      total: number;
      limit: number;
      offset: number;
    }>(`/expenses${query ? `?${query}` : ''}`);
  },

  get: (id: string) => request<{ expense: ExpenseWithUser }>(`/expenses/${id}`),

  create: (data: CreateExpenseRequest) =>
    request<{ expense: Expense }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateExpenseRequest) =>
    request<{ expense: Expense }>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/expenses/${id}`, {
      method: 'DELETE',
    }),

  getSummary: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);

    const query = params.toString();
    return request<{ summary: ExpenseSummary }>(
      `/expenses/summary${query ? `?${query}` : ''}`
    );
  },

  getCategories: () => request<{ categories: string[] }>('/expenses/categories'),
};
