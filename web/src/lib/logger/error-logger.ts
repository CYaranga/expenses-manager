import { LogCategories } from '@expenses-manager/shared';
import { loggerClient } from './client';
import { formatError, getPageInfo, getDeviceInfo } from './utils';

/**
 * Error Logger for tracking errors and crashes
 */
class ErrorLogger {
  logError(error: unknown, context?: Record<string, unknown>): void {
    loggerClient.error('Application error', LogCategories.ERROR, {
      ...formatError(error),
      ...context,
      ...getPageInfo(),
    });
  }

  logApiError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: unknown,
    context?: Record<string, unknown>
  ): void {
    loggerClient.error(`API error: ${method} ${endpoint}`, LogCategories.API, {
      endpoint,
      method,
      statusCode,
      ...formatError(error),
      ...context,
    });
  }

  logNetworkError(endpoint: string, error: unknown, context?: Record<string, unknown>): void {
    loggerClient.error(`Network error: ${endpoint}`, LogCategories.ERROR, {
      endpoint,
      networkError: true,
      ...formatError(error),
      ...context,
    });
  }

  logAuthError(action: string, error: unknown, context?: Record<string, unknown>): void {
    loggerClient.error(`Auth error: ${action}`, LogCategories.AUTH, {
      action,
      ...formatError(error),
      ...context,
    });
  }

  logValidationError(
    field: string,
    value: unknown,
    error: string,
    context?: Record<string, unknown>
  ): void {
    loggerClient.warn('Validation error', LogCategories.FORM, {
      field,
      value,
      error,
      validation: true,
      ...context,
    });
  }

  logUnhandledError(error: ErrorEvent): void {
    loggerClient.error('Unhandled error', LogCategories.ERROR, {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      error: error.error ? formatError(error.error) : undefined,
      ...getPageInfo(),
      ...getDeviceInfo(),
    });
  }

  logUnhandledRejection(event: PromiseRejectionEvent): void {
    loggerClient.error('Unhandled promise rejection', LogCategories.ERROR, {
      ...formatError(event.reason),
      promiseRejection: true,
      ...getPageInfo(),
      ...getDeviceInfo(),
    });
  }

  logSecurityError(message: string, context?: Record<string, unknown>): void {
    loggerClient.error(message, LogCategories.SECURITY, {
      ...context,
      ...getPageInfo(),
    });
  }

  setupGlobalErrorHandlers(): void {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.logUnhandledError(event);
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logUnhandledRejection(event);
    });
  }
}

export const errorLogger = new ErrorLogger();

// Setup global error handlers
errorLogger.setupGlobalErrorHandlers();
