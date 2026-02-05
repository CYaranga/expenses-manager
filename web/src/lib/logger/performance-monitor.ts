import { LogCategories } from '@expenses-manager/shared';
import { loggerClient } from './client';
import { getPageInfo } from './utils';

/**
 * Performance Monitor for tracking app performance
 */
class PerformanceMonitor {
  private timers: Map<string, number> = new Map();

  startTimer(operationName: string): void {
    this.timers.set(operationName, performance.now());
  }

  endTimer(operationName: string, metadata?: Record<string, unknown>): number | null {
    const startTime = this.timers.get(operationName);
    if (!startTime) {
      console.warn(`No timer found for operation: ${operationName}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operationName);

    const level = duration > 5000 ? 'error' : duration > 2000 ? 'warn' : 'info';

    loggerClient.log(
      level,
      `Operation: ${operationName} took ${Math.round(duration)}ms`,
      LogCategories.PERFORMANCE,
      {
        operation: operationName,
        duration_ms: Math.round(duration),
        thresholdExceeded: duration > 2000,
        ...metadata,
      }
    );

    return duration;
  }

  logRenderTime(componentName: string, renderTimeMs: number): void {
    if (renderTimeMs > 100) {
      loggerClient.warn(
        `Slow component render: ${componentName}`,
        LogCategories.PERFORMANCE,
        {
          component: componentName,
          renderTime: Math.round(renderTimeMs),
          type: 'render',
        }
      );
    }
  }

  logApiResponseTime(
    endpoint: string,
    method: string,
    durationMs: number,
    statusCode: number
  ): void {
    const level = durationMs > 3000 ? 'warn' : 'debug';

    loggerClient.log(
      level,
      `API call: ${method} ${endpoint}`,
      LogCategories.API,
      {
        endpoint,
        method,
        duration_ms: Math.round(durationMs),
        statusCode,
        slow: durationMs > 3000,
      }
    );
  }

  logPageLoadTime(): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
          const renderTime = perfData.domComplete - perfData.domLoading;

          loggerClient.info('Page load complete', LogCategories.PERFORMANCE, {
            pageLoadTime,
            domReadyTime,
            renderTime,
            ...getPageInfo(),
          });
        }, 0);
      });
    }
  }

  logWebVitals(metric: {
    name: string;
    value: number;
    rating?: string;
    delta?: number;
  }): void {
    const level = metric.rating === 'poor' ? 'warn' : 'info';

    loggerClient.log(level, `Web Vital: ${metric.name}`, LogCategories.PERFORMANCE, {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  /**
   * Monitor a function's execution time
   */
  async measureAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.startTimer(operationName);
    try {
      const result = await fn();
      this.endTimer(operationName, metadata);
      return result;
    } catch (error) {
      this.endTimer(operationName, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Monitor a synchronous function's execution time
   */
  measure<T>(
    operationName: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    this.startTimer(operationName);
    try {
      const result = fn();
      this.endTimer(operationName, metadata);
      return result;
    } catch (error) {
      this.endTimer(operationName, { ...metadata, error: true });
      throw error;
    }
  }

  logMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      loggerClient.debug('Memory usage', LogCategories.PERFORMANCE, {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      });
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Setup page load monitoring
performanceMonitor.logPageLoadTime();
