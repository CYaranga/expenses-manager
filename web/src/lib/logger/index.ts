// Main logger exports
export { loggerClient } from './client';
export { loggerAuth } from './auth';
export { activityLogger } from './activity-logger';
export { errorLogger } from './error-logger';
export { performanceMonitor } from './performance-monitor';
export { apiLogger } from './api-logger';
export { offlineQueue } from './offline-queue';
export { loggerConfig, environment } from './config';
export * from './utils';

// Re-export logger types from shared
export type {
  LogLevel,
  LogSource,
  Environment,
  Log,
  CreateLogInput,
  LogsResponse,
  LogCategory,
} from '@expenses-manager/shared';

export { LogCategories } from '@expenses-manager/shared';

// Initialize logger with user ID when available
import { loggerClient } from './client';
import { activityLogger } from './activity-logger';
import { errorLogger } from './error-logger';
import { performanceMonitor } from './performance-monitor';
import { apiLogger } from './api-logger';

export function initializeLogger(userId: string | null): void {
  loggerClient.setUserId(userId);
}

// Export a unified logger interface
export const logger = {
  client: loggerClient,
  activity: activityLogger,
  error: errorLogger,
  performance: performanceMonitor,
  api: apiLogger,
  initialize: initializeLogger,
};

// Default export
export default logger;
