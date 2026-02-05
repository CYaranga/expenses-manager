import type { Environment, LogLevel } from '@expenses-manager/shared';

export interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  logToConsole: boolean;
  apiUrl: string;
  username: string;
  password: string;
  batchSize: number;
  batchTimeout: number;
  maxQueueSize: number;
  retries: number;
  retryDelay: number;
}

const getEnvironment = (): Environment => {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'dev';
  } else if (hostname.includes('staging') || hostname.includes('test')) {
    return 'test';
  } else {
    return 'prod';
  }
};

const environmentConfigs: Record<Environment, Partial<LoggerConfig>> = {
  dev: {
    enabled: true,
    minLevel: 'debug',
    logToConsole: true,
  },
  test: {
    enabled: true,
    minLevel: 'info',
    logToConsole: false,
  },
  prod: {
    enabled: true,
    minLevel: 'info',
    logToConsole: false,
  },
};

export const environment = getEnvironment();

export const loggerConfig: LoggerConfig = {
  enabled: true,
  minLevel: 'debug',
  logToConsole: true,
  apiUrl: import.meta.env.VITE_LOGGER_API_URL || 'https://private-logger-api.christian-yaranga-05.workers.dev',
  username: import.meta.env.VITE_LOGGER_USERNAME || '',
  password: import.meta.env.VITE_LOGGER_PASSWORD || '',
  batchSize: 10,
  batchTimeout: 5000,
  maxQueueSize: 100,
  retries: 3,
  retryDelay: 1000,
  ...environmentConfigs[environment],
};

export const LOGGER_TOKEN_KEY = 'logger_auth_token';
export const LOGGER_TOKEN_EXPIRY_KEY = 'logger_token_expiry';
