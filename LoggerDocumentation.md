# Private Logger API Documentation

Complete guide for integrating the Private Logger API into your frontend application.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [TypeScript Types](#typescript-types)
6. [React Integration](#react-integration)
7. [Use Case Scenarios](#use-case-scenarios)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

---

## Overview

Private Logger is a centralized logging system designed for multi-platform applications (iOS, Android, Web, Desktop, etc.). It provides structured logging with rich metadata, HTTP request/response tracking, and powerful filtering capabilities.

**Base URL**: `https://private-logger-api.christian-yaranga-05.workers.dev`

**Features**:
- Session-based authentication with HTTP-only cookies
- Structured logging with custom metadata
- HTTP request/response tracking
- Multi-environment support (dev, test, prod)
- Device and source tracking
- Automatic archiving of old logs
- Storage management
- Advanced filtering and search

---

## Architecture

```
Your Application (Web/Mobile/Backend)
           ↓
    Logger API Client
           ↓
  Cloudflare Workers API (Hono)
           ↓
     D1 SQLite Database
```

**Storage**:
- **Active logs**: Recent logs in the main `logs` table (last 7 days)
- **Archives**: Older logs automatically archived daily (3 AM UTC)
- **Limit**: 5 GB total storage with automatic archiving at 70% usage

---

## Authentication

### Session-Based Authentication

The API uses session-based authentication with HTTP-only cookies. Sessions expire after 24 hours.

#### Login

**Endpoint**: `POST /auth/login`

**Request**:
```typescript
interface LoginRequest {
  username: string;
  password: string;
}
```

**Response**:
```typescript
interface LoginResponse {
  success: boolean;
  user: {
    id: number;
    username: string;
  };
  token: string;          // Session token
  expiresAt: string;      // ISO 8601 timestamp
}
```

**Example**:
```typescript
async function login(username: string, password: string) {
  const response = await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: enables cookies
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();

  // Store token for Authorization header (optional, cookies are primary)
  localStorage.setItem('authToken', data.token);

  return data;
}
```

#### Logout

**Endpoint**: `POST /auth/logout`

**Example**:
```typescript
async function logout() {
  await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  localStorage.removeItem('authToken');
}
```

#### Verify Session

**Endpoint**: `GET /auth/verify`

**Response**:
```typescript
interface VerifyResponse {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
  };
}
```

**Example**:
```typescript
async function verifySession() {
  const response = await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/auth/verify', {
    credentials: 'include',
  });

  if (!response.ok) {
    return { authenticated: false };
  }

  return response.json();
}
```

---

## API Endpoints

All endpoints (except `/auth/*`) require authentication. Include session cookie or `Authorization: Bearer <token>` header.

### Logs

#### Create Log

**Endpoint**: `POST /logs`

**Request**:
```typescript
interface CreateLogInput {
  user_id: string;                          // Required: User identifier
  message: string;                          // Required: Log message
  device_id?: string;                       // Device/session identifier
  metadata?: Record<string, unknown>;       // Custom metadata
  environment?: 'dev' | 'test' | 'prod';   // Default: 'dev'
  source?: LogSource;                       // Platform source
  level?: LogLevel;                         // Default: 'info'
  category?: string;                        // Default: 'GENERAL'

  // HTTP tracking fields
  http_method?: HttpMethod;
  endpoint?: string;
  request_data?: Record<string, unknown> | string;
  response_data?: Record<string, unknown> | string;
  status_code?: number;
  duration_ms?: number;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
type LogSource = 'ios' | 'android' | 'web' | 'desktop' | 'backend' | 'simulator' | 'cli' | 'api' | 'watch' | 'tv' | 'extension' | 'iot';
```

**Response**:
```typescript
interface CreateLogResponse {
  success: boolean;
  log: Log;
}
```

**Example**:
```typescript
async function createLog(logData: CreateLogInput) {
  const response = await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    },
    credentials: 'include',
    body: JSON.stringify(logData),
  });

  if (!response.ok) {
    throw new Error('Failed to create log');
  }

  return response.json();
}

// Usage example
await createLog({
  user_id: 'user_123',
  device_id: 'iPhone_15_Pro',
  message: 'User completed checkout',
  level: 'info',
  category: 'CHECKOUT',
  environment: 'prod',
  source: 'ios',
  metadata: {
    cart_total: 99.99,
    item_count: 3,
    payment_method: 'credit_card',
  },
});
```

#### Get Logs (with filtering)

**Endpoint**: `GET /logs`

**Query Parameters**:
```typescript
interface LogQueryParams {
  user_id?: string;
  device_id?: string;
  environment?: 'dev' | 'test' | 'prod';
  source?: LogSource;
  level?: LogLevel;
  category?: string;
  http_method?: HttpMethod;
  search?: string;        // Search in message, metadata, endpoint, etc.
  limit?: number;         // Default: 100
  offset?: number;        // Default: 0 (for pagination)
}
```

**Response**:
```typescript
interface LogsResponse {
  logs: Log[];
  total: number;    // Total count matching filters
  limit: number;
  offset: number;
}

interface Log {
  id: number;
  user_id: string;
  device_id: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  environment: 'dev' | 'test' | 'prod';
  source: LogSource | null;
  level: LogLevel;
  category: string;
  http_method: HttpMethod | null;
  endpoint: string | null;
  request_data: Record<string, unknown> | string | null;
  response_data: Record<string, unknown> | string | null;
  status_code: number | null;
  duration_ms: number | null;
  created_at: string;     // ISO 8601 timestamp
}
```

**Example**:
```typescript
async function fetchLogs(params: LogQueryParams) {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(
    `https://private-logger-api.christian-yaranga-05.workers.dev/logs?${queryParams}`,
    {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch logs');
  }

  return response.json() as Promise<LogsResponse>;
}

// Usage examples
const errorLogs = await fetchLogs({ level: 'error', limit: 50 });
const userLogs = await fetchLogs({ user_id: 'user_123', environment: 'prod' });
const searchResults = await fetchLogs({ search: 'payment failed' });
```

#### Get Recent Logs

**Endpoint**: `GET /logs/recent`

Get logs from the last N hours for a specific device or user.

**Query Parameters**:
```typescript
interface RecentLogsParams {
  device_id?: string;   // At least one required
  user_id?: string;     // At least one required
  hours?: number;       // Default: 24, min: 1, max: 720 (30 days)
}
```

**Response**:
```typescript
interface RecentLogsResponse {
  logs: Log[];
  count: number;
  hours: number;
  device_id: string | null;
  user_id: string | null;
}
```

**Example**:
```typescript
async function fetchRecentLogs(params: RecentLogsParams) {
  const queryParams = new URLSearchParams();

  if (params.device_id) queryParams.append('device_id', params.device_id);
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.hours) queryParams.append('hours', String(params.hours));

  const response = await fetch(
    `https://private-logger-api.christian-yaranga-05.workers.dev/logs/recent?${queryParams}`,
    {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch recent logs');
  }

  return response.json() as Promise<RecentLogsResponse>;
}

// Get last 6 hours of logs for a device
const recentLogs = await fetchRecentLogs({
  device_id: 'iPhone_15_Pro',
  hours: 6
});
```

#### Get Single Log

**Endpoint**: `GET /logs/:id`

**Example**:
```typescript
async function fetchLog(id: number) {
  const response = await fetch(
    `https://private-logger-api.christian-yaranga-05.workers.dev/logs/${id}`,
    {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Log not found');
  }

  return response.json() as Promise<Log>;
}
```

#### Delete Log

**Endpoint**: `DELETE /logs/:id`

**Example**:
```typescript
async function deleteLog(id: number) {
  const response = await fetch(
    `https://private-logger-api.christian-yaranga-05.workers.dev/logs/${id}`,
    {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete log');
  }

  return response.json();
}
```

#### Bulk Delete Logs

**Endpoint**: `POST /logs/bulk-delete`

Delete multiple logs matching specific criteria. At least one filter is required.

**Request**:
```typescript
interface BulkDeleteParams {
  user_id?: string;
  device_id?: string;
  category?: string;
  start_date?: string;  // YYYY-MM-DD
  end_date?: string;    // YYYY-MM-DD
}
```

**Response**:
```typescript
interface BulkDeleteResponse {
  success: boolean;
  deleted: number;
  message: string;
}
```

**Example**:
```typescript
async function bulkDeleteLogs(params: BulkDeleteParams) {
  const response = await fetch(
    'https://private-logger-api.christian-yaranga-05.workers.dev/logs/bulk-delete',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      credentials: 'include',
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to bulk delete');
  }

  return response.json() as Promise<BulkDeleteResponse>;
}

// Delete all logs from a specific device
await bulkDeleteLogs({ device_id: 'old_device_123' });

// Delete logs from date range
await bulkDeleteLogs({
  start_date: '2024-01-01',
  end_date: '2024-01-31'
});

// Delete all logs in a category for a user
await bulkDeleteLogs({
  user_id: 'user_123',
  category: 'DEBUG'
});
```

### Metadata Endpoints

#### Get Users

**Endpoint**: `GET /users`

Returns list of unique user IDs that have logs.

**Response**:
```typescript
interface UsersResponse {
  users: string[];
}
```

#### Get Categories

**Endpoint**: `GET /categories`

Returns list of unique categories used in logs.

**Response**:
```typescript
interface CategoriesResponse {
  categories: string[];
}
```

#### Get Devices

**Endpoint**: `GET /devices`

Returns list of unique device IDs.

**Response**:
```typescript
interface DevicesResponse {
  devices: string[];
}
```

#### Get Sources

**Endpoint**: `GET /sources`

Returns list of unique sources (platforms).

**Response**:
```typescript
interface SourcesResponse {
  sources: LogSource[];
}
```

**Example**:
```typescript
async function fetchMetadata() {
  const [users, categories, devices, sources] = await Promise.all([
    fetch('https://private-logger-api.christian-yaranga-05.workers.dev/users', {
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
    }).then(r => r.json()),

    fetch('https://private-logger-api.christian-yaranga-05.workers.dev/categories', {
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
    }).then(r => r.json()),

    fetch('https://private-logger-api.christian-yaranga-05.workers.dev/devices', {
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
    }).then(r => r.json()),

    fetch('https://private-logger-api.christian-yaranga-05.workers.dev/sources', {
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
    }).then(r => r.json()),
  ]);

  return {
    users: users.users,
    categories: categories.categories,
    devices: devices.devices,
    sources: sources.sources,
  };
}
```

### Statistics

#### Get Stats

**Endpoint**: `GET /stats`

Returns comprehensive statistics about logs.

**Response**:
```typescript
interface Stats {
  total: number;
  uniqueUsers: number;
  last24Hours: number;
  apiCalls: number;
  errorCount: number;
  byEnvironment: Array<{ environment: string; count: number }>;
  byLevel: Array<{ level: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  archives: {
    count: number;
    totalLogs: number;
  };
}
```

**Example**:
```typescript
async function fetchStats() {
  const response = await fetch(
    'https://private-logger-api.christian-yaranga-05.workers.dev/stats',
    {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json() as Promise<Stats>;
}
```

#### Get Storage Info

**Endpoint**: `GET /storage`

Returns storage usage and limits.

**Response**:
```typescript
interface Storage {
  used_bytes: number;
  limit_bytes: number;
  usage_percent: number;
  logs_count: number;
  archives_count: number;
  archived_logs_total: number;
  warning: boolean;          // True if usage >= 80%
  should_archive: boolean;   // True if usage >= 70%
}
```

**Example**:
```typescript
async function fetchStorage() {
  const response = await fetch(
    'https://private-logger-api.christian-yaranga-05.workers.dev/storage',
    {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch storage');
  }

  return response.json() as Promise<Storage>;
}
```

### Archives

Logs older than 7 days are automatically archived daily at 3 AM UTC. Archives can be downloaded, listed, or deleted.

#### List Archives

**Endpoint**: `GET /archives`

**Response**:
```typescript
interface Archive {
  id: number;
  archive_date: string;   // YYYY-MM-DD
  log_count: number;
  created_at: string;
}

interface ArchivesResponse {
  archives: Archive[];
}
```

#### Download Archive

**Endpoint**: `GET /archives/:date/download`

Downloads a JSON file with all logs from the specified date.

**Example**:
```typescript
function downloadArchive(date: string) {
  const token = localStorage.getItem('authToken');
  const url = `https://private-logger-api.christian-yaranga-05.workers.dev/archives/${date}/download`;

  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `logs-${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

#### Export All Archives

**Endpoint**: `GET /archives/export-all`

Downloads a single JSON file with all archived logs.

**Example**:
```typescript
function exportAllArchives() {
  const url = 'https://private-logger-api.christian-yaranga-05.workers.dev/archives/export-all';

  const link = document.createElement('a');
  link.href = url;
  link.download = `all-logs-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

#### Run Archive

**Endpoint**: `POST /archives/run`

Manually trigger archiving of old logs (normally runs automatically).

**Response**:
```typescript
interface ArchiveRunResponse {
  archived: number;
  dates: string[];
}
```

#### Delete Archive

**Endpoint**: `DELETE /archives/:date`

Permanently delete an archive (frees up storage space).

**Example**:
```typescript
async function deleteArchive(date: string) {
  const response = await fetch(
    `https://private-logger-api.christian-yaranga-05.workers.dev/archives/${date}`,
    {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete archive');
  }

  return response.json();
}
```

---

## TypeScript Types

Complete type definitions for use in your application:

```typescript
// types.ts
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
  | 'iot';

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

export interface Stats {
  total: number;
  uniqueUsers: number;
  last24Hours: number;
  byEnvironment: Array<{ environment: string; count: number }>;
  byLevel: Array<{ level: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  apiCalls: number;
  errorCount: number;
  archives: {
    count: number;
    totalLogs: number;
  };
}

export interface Storage {
  used_bytes: number;
  limit_bytes: number;
  usage_percent: number;
  logs_count: number;
  archives_count: number;
  archived_logs_total: number;
  warning: boolean;
  should_archive: boolean;
}

export interface Archive {
  id: number;
  archive_date: string;
  log_count: number;
  created_at: string;
}

export interface BulkDeleteParams {
  user_id?: string;
  device_id?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
}

export interface BulkDeleteResponse {
  success: boolean;
  deleted: number;
  message: string;
}
```

---

## React Integration

### API Client Setup

Create a reusable API client with authentication handling:

```typescript
// api/client.ts
const API_BASE = 'https://private-logger-api.christian-yaranga-05.workers.dev';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function getFetchOptions(options: RequestInit = {}): RequestInit {
  return {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };
}

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE}${endpoint}`, getFetchOptions());
    if (!response.ok) throw new Error(`GET ${endpoint} failed`);
    return response.json();
  },

  post: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE}${endpoint}`, getFetchOptions({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    }));
    if (!response.ok) throw new Error(`POST ${endpoint} failed`);
    return response.json();
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE}${endpoint}`, getFetchOptions({
      method: 'DELETE',
    }));
    if (!response.ok) throw new Error(`DELETE ${endpoint} failed`);
    return response.json();
  },
};
```

### Authentication Context

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    verifySession();
  }, []);

  async function verifySession() {
    try {
      const response = await fetch(
        'https://private-logger-api.christian-yaranga-05.workers.dev/auth/verify',
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.authenticated ? data.user : null);
      }
    } catch (error) {
      console.error('Session verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const response = await fetch(
      'https://private-logger-api.christian-yaranga-05.workers.dev/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      }
    );

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
  }

  async function logout() {
    await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    localStorage.removeItem('authToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Custom Hooks

```typescript
// hooks/useLogs.ts
import { useState, useEffect } from 'react';
import type { Log, LogsResponse } from '../types';

interface UseLogsParams {
  user_id?: string;
  device_id?: string;
  environment?: 'dev' | 'test' | 'prod';
  level?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useLogs(params: UseLogsParams) {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [JSON.stringify(params)]);

  async function fetchLogs() {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(
        `https://private-logger-api.christian-yaranga-05.workers.dev/logs?${queryParams}`,
        {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }

  return { data, isLoading, error, refetch: fetchLogs };
}

// hooks/useStats.ts
import { useState, useEffect } from 'react';
import type { Stats } from '../types';

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://private-logger-api.christian-yaranga-05.workers.dev/stats',
        {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }

  return { stats, isLoading, error, refetch: fetchStats };
}
```

### Component Examples

#### Log Viewer Component

```typescript
// components/LogViewer.tsx
import React, { useState } from 'react';
import { useLogs } from '../hooks/useLogs';
import type { LogLevel } from '../types';

export function LogViewer() {
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    search: '',
  });
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data, isLoading, error, refetch } = useLogs({
    ...filters,
    limit,
    offset: page * limit,
  });

  if (isLoading) return <div>Loading logs...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      {/* Filters */}
      <div className="filters">
        <select
          value={filters.level}
          onChange={(e) => setFilters({ ...filters, level: e.target.value })}
        >
          <option value="">All Levels</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>

        <input
          type="text"
          placeholder="Search logs..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        <button onClick={refetch}>Refresh</button>
      </div>

      {/* Logs Table */}
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Level</th>
            <th>Message</th>
            <th>User</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {data.logs.map((log) => (
            <tr key={log.id} className={`log-${log.level}`}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.level}</td>
              <td>{log.message}</td>
              <td>{log.user_id}</td>
              <td>{log.category}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
        >
          Previous
        </button>
        <span>
          Page {page + 1} of {Math.ceil(data.total / limit)}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={(page + 1) * limit >= data.total}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

#### Stats Dashboard

```typescript
// components/StatsDashboard.tsx
import React from 'react';
import { useStats } from '../hooks/useStats';

export function StatsDashboard() {
  const { stats, isLoading, error } = useStats();

  if (isLoading) return <div>Loading stats...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!stats) return null;

  return (
    <div className="stats-dashboard">
      <div className="stat-card">
        <h3>Total Logs</h3>
        <p className="stat-value">{stats.total.toLocaleString()}</p>
      </div>

      <div className="stat-card">
        <h3>Unique Users</h3>
        <p className="stat-value">{stats.uniqueUsers}</p>
      </div>

      <div className="stat-card">
        <h3>Last 24 Hours</h3>
        <p className="stat-value">{stats.last24Hours.toLocaleString()}</p>
      </div>

      <div className="stat-card">
        <h3>Error Count</h3>
        <p className="stat-value error">{stats.errorCount}</p>
      </div>

      <div className="stat-section">
        <h3>By Environment</h3>
        {stats.byEnvironment.map((item) => (
          <div key={item.environment} className="stat-row">
            <span>{item.environment}</span>
            <span>{item.count}</span>
          </div>
        ))}
      </div>

      <div className="stat-section">
        <h3>By Level</h3>
        {stats.byLevel.map((item) => (
          <div key={item.level} className="stat-row">
            <span>{item.level}</span>
            <span>{item.count}</span>
          </div>
        ))}
      </div>

      <div className="stat-section">
        <h3>Top Categories</h3>
        {stats.byCategory.map((item) => (
          <div key={item.category} className="stat-row">
            <span>{item.category}</span>
            <span>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Use Case Scenarios

### 1. Mobile App Crash Logging (iOS/Android)

```typescript
// logger.ts - Mobile app logger utility
import type { CreateLogInput } from './types';

const API_URL = 'https://private-logger-api.christian-yaranga-05.workers.dev';

class MobileLogger {
  private userId: string;
  private deviceId: string;
  private authToken: string;

  constructor(userId: string, deviceId: string, authToken: string) {
    this.userId = userId;
    this.deviceId = deviceId;
    this.authToken = authToken;
  }

  async log(level: 'debug' | 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) {
    const logData: CreateLogInput = {
      user_id: this.userId,
      device_id: this.deviceId,
      message,
      level,
      source: 'ios', // or 'android'
      environment: 'prod',
      category: 'APP',
      metadata: {
        ...metadata,
        app_version: '1.2.0',
        os_version: '17.2',
      },
    };

    try {
      await fetch(`${API_URL}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        credentials: 'include',
        body: JSON.stringify(logData),
      });
    } catch (error) {
      console.error('Failed to send log:', error);
      // Optionally: queue for retry
    }
  }

  async logError(error: Error, context?: Record<string, unknown>) {
    await this.log('error', error.message, {
      stack: error.stack,
      name: error.name,
      ...context,
    });
  }

  async logCrash(error: Error) {
    await this.log('error', `App crashed: ${error.message}`, {
      category: 'CRASH',
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
}

// Usage in mobile app
const logger = new MobileLogger('user_123', 'iPhone_15_Pro_XYZ', 'auth_token_here');

try {
  // Some operation
  throw new Error('Payment processing failed');
} catch (error) {
  await logger.logError(error as Error, {
    screen: 'CheckoutScreen',
    action: 'processPayment',
  });
}
```

### 2. API Request/Response Tracking

```typescript
// middleware/apiLogger.ts
import type { CreateLogInput } from '../types';

export async function logApiCall(
  userId: string,
  method: string,
  endpoint: string,
  requestData: unknown,
  responseData: unknown,
  statusCode: number,
  durationMs: number
) {
  const logData: CreateLogInput = {
    user_id: userId,
    message: `${method} ${endpoint}`,
    level: statusCode >= 400 ? 'error' : 'info',
    category: 'API',
    source: 'backend',
    environment: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
    http_method: method as any,
    endpoint,
    request_data: requestData,
    response_data: responseData,
    status_code: statusCode,
    duration_ms: durationMs,
  };

  await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LOGGER_API_TOKEN}`,
    },
    credentials: 'include',
    body: JSON.stringify(logData),
  });
}

// Express.js middleware example
export function apiLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;

    logApiCall(
      req.user?.id || 'anonymous',
      req.method,
      req.path,
      req.body,
      data,
      res.statusCode,
      duration
    ).catch(console.error);

    return originalSend.call(this, data);
  };

  next();
}
```

### 3. User Activity Tracking

```typescript
// analytics/activityLogger.ts
import type { CreateLogInput } from '../types';

export class ActivityLogger {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
  }

  async trackPageView(pageName: string, metadata?: Record<string, unknown>) {
    await this.log('info', `Page viewed: ${pageName}`, {
      category: 'PAGE_VIEW',
      page: pageName,
      ...metadata,
    });
  }

  async trackButtonClick(buttonName: string, context?: Record<string, unknown>) {
    await this.log('info', `Button clicked: ${buttonName}`, {
      category: 'USER_ACTION',
      action: 'click',
      element: buttonName,
      ...context,
    });
  }

  async trackFormSubmit(formName: string, success: boolean, metadata?: Record<string, unknown>) {
    await this.log(success ? 'info' : 'warn', `Form submitted: ${formName}`, {
      category: 'FORM',
      form: formName,
      success,
      ...metadata,
    });
  }

  async trackFeatureUse(featureName: string, metadata?: Record<string, unknown>) {
    await this.log('info', `Feature used: ${featureName}`, {
      category: 'FEATURE',
      feature: featureName,
      ...metadata,
    });
  }

  private async log(level: string, message: string, metadata: Record<string, unknown>) {
    const logData: CreateLogInput = {
      user_id: this.userId,
      device_id: this.sessionId,
      message,
      level: level as any,
      source: 'web',
      environment: 'prod',
      metadata: {
        ...metadata,
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      },
    };

    await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      credentials: 'include',
      body: JSON.stringify(logData),
    });
  }
}

// Usage in React component
function CheckoutPage() {
  const activityLogger = new ActivityLogger('user_123', 'session_xyz');

  useEffect(() => {
    activityLogger.trackPageView('CheckoutPage', {
      cart_value: 99.99,
      item_count: 3,
    });
  }, []);

  const handleCheckout = async () => {
    try {
      await activityLogger.trackButtonClick('checkout_button', {
        cart_value: 99.99,
      });

      // Process checkout...

      await activityLogger.trackFormSubmit('checkout_form', true, {
        payment_method: 'credit_card',
      });
    } catch (error) {
      await activityLogger.trackFormSubmit('checkout_form', false, {
        error: error.message,
      });
    }
  };

  return <button onClick={handleCheckout}>Checkout</button>;
}
```

### 4. Performance Monitoring

```typescript
// performance/monitor.ts
import type { CreateLogInput } from '../types';

export class PerformanceMonitor {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async logSlowOperation(operationName: string, durationMs: number, metadata?: Record<string, unknown>) {
    const level = durationMs > 5000 ? 'error' : durationMs > 2000 ? 'warn' : 'info';

    const logData: CreateLogInput = {
      user_id: this.userId,
      message: `Slow operation: ${operationName} took ${durationMs}ms`,
      level,
      category: 'PERFORMANCE',
      source: 'web',
      environment: 'prod',
      duration_ms: durationMs,
      metadata: {
        operation: operationName,
        threshold_exceeded: durationMs > 2000,
        ...metadata,
      },
    };

    await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      credentials: 'include',
      body: JSON.stringify(logData),
    });
  }

  async trackRenderTime(componentName: string, renderTimeMs: number) {
    if (renderTimeMs > 100) {
      await this.logSlowOperation(`${componentName} render`, renderTimeMs, {
        component: componentName,
        type: 'render',
      });
    }
  }
}

// Usage with React
function usePerformanceTracking(componentName: string) {
  const monitor = new PerformanceMonitor('user_123');

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      monitor.trackRenderTime(componentName, renderTime);
    };
  }, [componentName]);
}

function HeavyComponent() {
  usePerformanceTracking('HeavyComponent');

  // Component logic...

  return <div>Heavy component</div>;
}
```

### 5. Multi-Environment Debugging

```typescript
// debug/environmentLogger.ts
import type { CreateLogInput, Environment } from '../types';

export class EnvironmentLogger {
  private userId: string;
  private environment: Environment;

  constructor(userId: string) {
    this.userId = userId;
    this.environment = this.detectEnvironment();
  }

  private detectEnvironment(): Environment {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'dev';
    } else if (hostname.includes('staging') || hostname.includes('test')) {
      return 'test';
    } else {
      return 'prod';
    }
  }

  async debug(message: string, metadata?: Record<string, unknown>) {
    // Only log debug messages in dev/test
    if (this.environment === 'prod') return;

    await this.log('debug', message, 'DEBUG', metadata);
  }

  async info(message: string, metadata?: Record<string, unknown>) {
    await this.log('info', message, 'INFO', metadata);
  }

  async warn(message: string, metadata?: Record<string, unknown>) {
    await this.log('warn', message, 'WARNING', metadata);
  }

  async error(message: string, metadata?: Record<string, unknown>) {
    await this.log('error', message, 'ERROR', metadata);
  }

  private async log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    category: string,
    metadata?: Record<string, unknown>
  ) {
    const logData: CreateLogInput = {
      user_id: this.userId,
      message,
      level,
      category,
      source: 'web',
      environment: this.environment,
      metadata: {
        ...metadata,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
    };

    // Also log to console in dev
    if (this.environment === 'dev') {
      console[level](message, metadata);
    }

    await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      credentials: 'include',
      body: JSON.stringify(logData),
    });
  }
}

// Usage
const logger = new EnvironmentLogger('user_123');

await logger.debug('Component mounted', { component: 'App' });
await logger.info('User logged in', { method: 'oauth' });
await logger.warn('API response slow', { duration: 3500 });
await logger.error('Payment failed', { error_code: 'CARD_DECLINED' });
```

### 6. Device-Specific Issue Tracking

```typescript
// device/deviceLogger.ts
import type { CreateLogInput } from '../types';

export class DeviceLogger {
  private userId: string;
  private deviceId: string;
  private deviceInfo: Record<string, unknown>;

  constructor(userId: string, deviceId: string) {
    this.userId = userId;
    this.deviceId = deviceId;
    this.deviceInfo = this.collectDeviceInfo();
  }

  private collectDeviceInfo(): Record<string, unknown> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      connection: (navigator as any).connection?.effectiveType || 'unknown',
    };
  }

  async logDeviceIssue(issue: string, metadata?: Record<string, unknown>) {
    const logData: CreateLogInput = {
      user_id: this.userId,
      device_id: this.deviceId,
      message: issue,
      level: 'error',
      category: 'DEVICE_ISSUE',
      source: 'web',
      environment: 'prod',
      metadata: {
        ...this.deviceInfo,
        ...metadata,
      },
    };

    await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      credentials: 'include',
      body: JSON.stringify(logData),
    });
  }

  async getRecentDeviceLogs(hours: number = 24) {
    const response = await fetch(
      `https://private-logger-api.christian-yaranga-05.workers.dev/logs/recent?device_id=${this.deviceId}&hours=${hours}`,
      {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch device logs');
    }

    return response.json();
  }
}

// Usage
const deviceLogger = new DeviceLogger('user_123', 'device_xyz_789');

// Log device-specific issue
await deviceLogger.logDeviceIssue('WebGL context lost', {
  error: 'CONTEXT_LOST_WEBGL',
  timestamp: Date.now(),
});

// Get recent logs for this device
const recentLogs = await deviceLogger.getRecentDeviceLogs(6);
console.log('Device logs (last 6 hours):', recentLogs);
```

---

## Error Handling

### Comprehensive Error Handling

```typescript
// utils/errorHandler.ts
export class LoggerError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'LoggerError';
  }
}

export async function safeApiCall<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    retryDelay?: number;
    onError?: (error: Error) => void;
  } = {}
): Promise<T> {
  const { retries = 3, retryDelay = 1000, onError } = options;
  let lastError: Error;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (onError) {
        onError(lastError);
      }

      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  throw new LoggerError(
    `Failed after ${retries} attempts: ${lastError!.message}`,
    undefined,
    lastError
  );
}

// Usage
async function createLogWithRetry(logData: CreateLogInput) {
  return safeApiCall(
    async () => {
      const response = await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify(logData),
      });

      if (!response.ok) {
        throw new LoggerError('Failed to create log', response.status);
      }

      return response.json();
    },
    {
      retries: 3,
      retryDelay: 1000,
      onError: (error) => {
        console.warn('Log creation failed, retrying...', error);
      },
    }
  );
}
```

### Offline Queue

```typescript
// utils/offlineQueue.ts
import type { CreateLogInput } from '../types';

class OfflineLogQueue {
  private queue: CreateLogInput[] = [];
  private readonly STORAGE_KEY = 'offline_log_queue';
  private readonly MAX_QUEUE_SIZE = 100;

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.flush();
    });
  }

  async add(log: CreateLogInput) {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.queue.shift(); // Remove oldest
    }

    this.queue.push(log);
    this.saveQueue();

    if (navigator.onLine) {
      await this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    const logsToSend = [...this.queue];
    this.queue = [];
    this.saveQueue();

    for (const log of logsToSend) {
      try {
        await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          credentials: 'include',
          body: JSON.stringify(log),
        });
      } catch (error) {
        // Re-add to queue if failed
        this.queue.push(log);
      }
    }

    if (this.queue.length > 0) {
      this.saveQueue();
    }
  }
}

export const offlineQueue = new OfflineLogQueue();

// Usage
await offlineQueue.add({
  user_id: 'user_123',
  message: 'Offline action performed',
  level: 'info',
  category: 'OFFLINE',
});
```

---

## Best Practices

### 1. Rate Limiting

Avoid overwhelming the API with excessive log requests:

```typescript
class RateLimitedLogger {
  private lastLogTime = 0;
  private readonly MIN_INTERVAL = 100; // ms between logs

  async log(data: CreateLogInput) {
    const now = Date.now();
    const timeSinceLastLog = now - this.lastLogTime;

    if (timeSinceLastLog < this.MIN_INTERVAL) {
      await new Promise(resolve =>
        setTimeout(resolve, this.MIN_INTERVAL - timeSinceLastLog)
      );
    }

    this.lastLogTime = Date.now();

    // Send log...
  }
}
```

### 2. Batch Logging

Send multiple logs in batches (if implementing batch endpoint):

```typescript
class BatchLogger {
  private batch: CreateLogInput[] = [];
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5000;
  private timer: NodeJS.Timeout | null = null;

  async add(log: CreateLogInput) {
    this.batch.push(log);

    if (this.batch.length >= this.BATCH_SIZE) {
      await this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.BATCH_TIMEOUT);
    }
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.batch.length === 0) return;

    const logsToSend = [...this.batch];
    this.batch = [];

    // Send logs individually (or use batch endpoint if available)
    await Promise.all(
      logsToSend.map(log =>
        fetch('https://private-logger-api.christian-yaranga-05.workers.dev/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          credentials: 'include',
          body: JSON.stringify(log),
        }).catch(console.error)
      )
    );
  }
}
```

### 3. Sensitive Data Filtering

Never log sensitive information:

```typescript
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'credit_card', 'ssn', 'token', 'secret', 'api_key'];
  const sanitized = { ...metadata };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

// Usage
const logData: CreateLogInput = {
  user_id: 'user_123',
  message: 'User login',
  metadata: sanitizeMetadata({
    username: 'john',
    password: 'secret123', // Will be redacted
    ip_address: '192.168.1.1',
  }),
};
```

### 4. Structured Logging Categories

Use consistent, meaningful categories:

```typescript
export const LogCategories = {
  AUTH: 'AUTH',
  API: 'API',
  DATABASE: 'DATABASE',
  UI: 'UI',
  PERFORMANCE: 'PERFORMANCE',
  ERROR: 'ERROR',
  SECURITY: 'SECURITY',
  PAYMENT: 'PAYMENT',
  ANALYTICS: 'ANALYTICS',
  FEATURE: 'FEATURE',
  DEBUG: 'DEBUG',
} as const;

// Usage
const logData: CreateLogInput = {
  user_id: 'user_123',
  message: 'Invalid login attempt',
  category: LogCategories.SECURITY,
  level: 'warn',
};
```

### 5. Environment-Specific Configuration

```typescript
const loggerConfig = {
  dev: {
    enabled: true,
    minLevel: 'debug' as const,
    logToConsole: true,
  },
  test: {
    enabled: true,
    minLevel: 'info' as const,
    logToConsole: false,
  },
  prod: {
    enabled: true,
    minLevel: 'warn' as const,
    logToConsole: false,
  },
};

const config = loggerConfig[process.env.NODE_ENV as keyof typeof loggerConfig];
```

### 6. Performance Optimization

Use Web Workers for logging in performance-critical apps:

```typescript
// loggerWorker.ts
self.addEventListener('message', async (e) => {
  const { type, data } = e.data;

  if (type === 'LOG') {
    try {
      await fetch('https://private-logger-api.christian-yaranga-05.workers.dev/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`,
        },
        body: JSON.stringify(data.log),
      });

      self.postMessage({ type: 'LOG_SUCCESS' });
    } catch (error) {
      self.postMessage({ type: 'LOG_ERROR', error });
    }
  }
});

// main.ts
const loggerWorker = new Worker('loggerWorker.ts');

function logInBackground(logData: CreateLogInput) {
  loggerWorker.postMessage({
    type: 'LOG',
    data: {
      log: logData,
      token: localStorage.getItem('authToken'),
    },
  });
}
```

---

## Summary

This Private Logger API provides a robust, scalable solution for centralized logging across multiple platforms. Key takeaways:

- **Authentication**: Session-based with 24-hour expiry
- **Flexible Logging**: Rich metadata, multi-platform support, HTTP tracking
- **Powerful Filtering**: Search, filter by user/device/category/level
- **Storage Management**: Automatic archiving, 5GB limit
- **Performance**: Pagination, bulk operations, efficient querying
- **Best Practices**: Rate limiting, offline support, error handling, data sanitization

For questions or issues, refer to the API health check at `GET /` or contact the development team.
@