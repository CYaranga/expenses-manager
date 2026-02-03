// Logger API types based on Private Logger API Documentation

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export type LogSource =
  | 'ios'
  | 'android'
  | 'web'
  | 'desktop'
  | 'backend'
  | 'simulator'
  | 'cli'
  | 'api'
  | 'watch'
  | 'tv'
  | 'extension'
  | 'iot'
  | 'expenses_manager';

export type Environment = 'dev' | 'test' | 'prod';

export interface Log {
  id: number;
  user_id: string;
  device_id: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  environment: Environment;
  source: LogSource | null;
  created_at: string;
  level: LogLevel;
  category: string;
  http_method: HttpMethod | null;
  endpoint: string | null;
  request_data: Record<string, unknown> | string | null;
  response_data: Record<string, unknown> | string | null;
  status_code: number | null;
  duration_ms: number | null;
}

export interface CreateLogInput {
  user_id: string;
  message: string;
  device_id?: string;
  metadata?: Record<string, unknown>;
  environment?: Environment;
  source?: LogSource;
  level?: LogLevel;
  category?: string;
  http_method?: HttpMethod;
  endpoint?: string;
  request_data?: Record<string, unknown> | string;
  response_data?: Record<string, unknown> | string;
  status_code?: number;
  duration_ms?: number;
}

export interface LogsResponse {
  logs: Log[];
  total: number;
  limit: number;
  offset: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: {
    id: number;
    username: string;
  };
  token: string;
  expiresAt: string;
}

export interface CreateLogResponse {
  success: boolean;
  log: Log;
}

// Log categories
export const LogCategories = {
  AUTH: 'AUTH',
  API: 'API',
  DATABASE: 'DATABASE',
  UI: 'UI',
  PERFORMANCE: 'PERFORMANCE',
  ERROR: 'ERROR',
  SECURITY: 'SECURITY',
  USER_ACTION: 'USER_ACTION',
  PAGE_VIEW: 'PAGE_VIEW',
  FORM: 'FORM',
  FEATURE: 'FEATURE',
  DEBUG: 'DEBUG',
  EXPENSE: 'EXPENSE',
  FAMILY: 'FAMILY',
  GENERAL: 'GENERAL',
} as const;

export type LogCategory = (typeof LogCategories)[keyof typeof LogCategories];
