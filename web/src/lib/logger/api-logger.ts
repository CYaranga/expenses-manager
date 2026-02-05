import type { HttpMethod } from '@expenses-manager/shared';
import { LogCategories } from '@expenses-manager/shared';
import { loggerClient } from './client';
import { sanitizeMetadata, truncate } from './utils';

/**
 * API Logger for tracking HTTP requests and responses
 */
class ApiLogger {
  logRequest(
    method: HttpMethod,
    endpoint: string,
    requestData?: unknown,
    metadata?: Record<string, unknown>
  ): void {
    loggerClient.debug(`API Request: ${method} ${endpoint}`, LogCategories.API, {
      http_method: method,
      endpoint,
      request_data: requestData ? truncate(requestData, 500) : undefined,
      direction: 'request',
      ...metadata,
    });
  }

  logResponse(
    method: HttpMethod,
    endpoint: string,
    statusCode: number,
    responseData?: unknown,
    durationMs?: number,
    metadata?: Record<string, unknown>
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'debug';

    loggerClient.log(level, `API Response: ${method} ${endpoint}`, LogCategories.API, {
      http_method: method,
      endpoint,
      status_code: statusCode,
      response_data: responseData ? truncate(responseData, 500) : undefined,
      duration_ms: durationMs,
      direction: 'response',
      success: statusCode >= 200 && statusCode < 300,
      ...metadata,
    });
  }

  logApiCall(
    method: HttpMethod,
    endpoint: string,
    requestData: unknown,
    responseData: unknown,
    statusCode: number,
    durationMs: number,
    metadata?: Record<string, unknown>
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    loggerClient.log(level, `${method} ${endpoint}`, LogCategories.API, {
      http_method: method,
      endpoint,
      request_data: requestData ? sanitizeMetadata(truncate(requestData, 500) as Record<string, unknown>) : undefined,
      response_data: responseData ? truncate(responseData, 500) : undefined,
      status_code: statusCode,
      duration_ms: durationMs,
      success: statusCode >= 200 && statusCode < 300,
      ...metadata,
    });
  }

  logApiError(
    method: HttpMethod,
    endpoint: string,
    error: unknown,
    durationMs?: number,
    metadata?: Record<string, unknown>
  ): void {
    loggerClient.error(`API Error: ${method} ${endpoint}`, LogCategories.API, {
      http_method: method,
      endpoint,
      error: error instanceof Error ? error.message : String(error),
      duration_ms: durationMs,
      ...metadata,
    });
  }

  /**
   * Wrap a fetch call with logging
   */
  async monitorFetch<T>(
    method: HttpMethod,
    endpoint: string,
    fetchFn: () => Promise<Response>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const response = await fetchFn();
      const duration = performance.now() - startTime;

      let responseData: unknown;
      try {
        responseData = await response.clone().json();
      } catch {
        responseData = await response.clone().text();
      }

      this.logResponse(method, endpoint, response.status, responseData, duration, metadata);

      if (!response.ok) {
        this.logApiError(method, endpoint, responseData, duration, {
          ...metadata,
          statusCode: response.status,
        });
      }

      return responseData as T;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logApiError(method, endpoint, error, duration, metadata);
      throw error;
    }
  }

  /**
   * Create a fetch wrapper with automatic logging
   */
  createLoggingFetch() {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method || 'GET') as HttpMethod;
      const startTime = performance.now();

      try {
        const response = await fetch(input, init);
        const duration = performance.now() - startTime;

        let responseData: unknown;
        try {
          responseData = await response.clone().json();
        } catch {
          // Response is not JSON
        }

        this.logResponse(method, url, response.status, responseData, duration);

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.logApiError(method, url, error, duration);
        throw error;
      }
    };
  }
}

export const apiLogger = new ApiLogger();
