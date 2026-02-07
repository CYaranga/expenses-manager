import type {
  ApiResponse,
  AuthTokens,
  UserPublic,
  Family,
  FamilyMember,
  Expense,
  ExpenseWithUser,
  DailyTotal,
  PeriodSummary,
  CreateFamilyRequest,
  UpdateFamilyRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  TransactionType,
  HttpMethod,
} from '../../../shared/src';
import { apiLogger, performanceMonitor } from './logger';

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
  const method = (options.method || 'GET') as HttpMethod;
  const startTime = performance.now();
  let requestBody: unknown;

  try {
    requestBody = options.body ? JSON.parse(options.body as string) : undefined;
  } catch {
    requestBody = options.body;
  }

  // Log request
  apiLogger.logRequest(method, endpoint, requestBody);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = (await response.json()) as ApiResponse<T>;
    const duration = performance.now() - startTime;

    // Log response
    apiLogger.logResponse(method, endpoint, response.status, data, duration);

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
          const retryDuration = performance.now() - startTime;

          apiLogger.logResponse(method, endpoint, retryResponse.status, retryData, retryDuration, {
            retry: true,
          });

          if (retryResponse.ok && retryData.success) {
            return retryData.data as T;
          }
        }
      }

      apiLogger.logApiError(method, endpoint, data.error || 'Request failed', duration);
      throw new Error(data.error || 'Request failed');
    }

    // Log API response time
    performanceMonitor.logApiResponseTime(endpoint, method, duration, response.status);

    return data.data as T;
  } catch (error) {
    const duration = performance.now() - startTime;
    apiLogger.logApiError(method, endpoint, error, duration);
    throw error;
  }
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
  googleSignIn: (credential: string) =>
    request<{ user: UserPublic; tokens: AuthTokens }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
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
    if (filters?.type) params.set('type', filters.type);
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

  getCategories: (type?: TransactionType) => {
    const params = type ? `?type=${type}` : '';
    return request<{ categories: string[] }>(`/expenses/categories${params}`);
  },

  getDailyTotals: (year: number) =>
    request<{ dailyTotals: DailyTotal[] }>(`/expenses/daily-totals?year=${year}`),

  getSummary: (startDate: string, endDate: string) =>
    request<{ summary: PeriodSummary }>(`/expenses/summary?start_date=${startDate}&end_date=${endDate}`),
};
