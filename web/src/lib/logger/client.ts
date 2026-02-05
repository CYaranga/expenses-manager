import type {
  CreateLogInput,
  LogLevel,
  LogCategory,
} from '@expenses-manager/shared';
import { loggerConfig, environment } from './config';
import { loggerAuth } from './auth';
import { offlineQueue } from './offline-queue';
import {
  sanitizeMetadata,
  getDeviceId,
  shouldLog,
  truncate,
} from './utils';

class LoggerClient {
  private batch: CreateLogInput[] = [];
  private batchTimer: number | null = null;
  private isFlushing = false;
  private userId: string | null = null;

  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  async log(
    level: LogLevel,
    message: string,
    category: LogCategory,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!shouldLog(level)) {
      return;
    }

    // Log to console in dev mode
    if (loggerConfig.logToConsole) {
      console[level](
        `[${category}] ${message}`,
        metadata ? sanitizeMetadata(metadata) : ''
      );
    }

    const logData: CreateLogInput = {
      user_id: this.userId || 'anonymous',
      device_id: getDeviceId(),
      message: truncate(message, 500) as string,
      level,
      category,
      source: 'expenses_manager',
      environment,
      metadata: metadata ? sanitizeMetadata(metadata) : undefined,
    };

    // Add to batch
    this.batch.push(logData);

    // If offline, queue it
    if (!navigator.onLine) {
      offlineQueue.add(logData);
      return;
    }

    // Trigger batch send if size reached
    if (this.batch.length >= loggerConfig.batchSize) {
      await this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => {
        this.flush();
      }, loggerConfig.batchTimeout);
    }
  }

  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.batch.length === 0 || this.isFlushing) {
      return;
    }

    this.isFlushing = true;
    const logsToSend = [...this.batch];
    this.batch = [];

    // Also process offline queue
    const queuedLogs = offlineQueue.getAll();
    const allLogs = [...logsToSend, ...queuedLogs];

    if (allLogs.length === 0) {
      this.isFlushing = false;
      return;
    }

    try {
      await this.sendLogs(allLogs);
      // Clear offline queue on success
      offlineQueue.clear();
    } catch (error) {
      console.error('Failed to send logs:', error);
      // Re-add failed logs to batch
      this.batch.unshift(...logsToSend);
      // Keep offline queue as is
    } finally {
      this.isFlushing = false;
    }
  }

  private async sendLogs(logs: CreateLogInput[]): Promise<void> {
    const token = await loggerAuth.getToken();

    if (!token) {
      console.warn('No logger auth token available');
      return;
    }

    // Send logs in parallel (with retry logic)
    const promises = logs.map((log) => this.sendLog(log, token));
    await Promise.allSettled(promises);
  }

  private async sendLog(
    log: CreateLogInput,
    token: string,
    attempt: number = 1
  ): Promise<void> {
    try {
      const response = await fetch(`${loggerConfig.apiUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await response.json();
      return;
    } catch (error) {
      if (attempt < loggerConfig.retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, loggerConfig.retryDelay * attempt)
        );
        return this.sendLog(log, token, attempt + 1);
      }

      // Final failure - add to offline queue
      offlineQueue.add(log);
      throw error;
    }
  }

  // Convenience methods
  debug(message: string, category: LogCategory, metadata?: Record<string, unknown>): void {
    this.log('debug', message, category, metadata);
  }

  info(message: string, category: LogCategory, metadata?: Record<string, unknown>): void {
    this.log('info', message, category, metadata);
  }

  warn(message: string, category: LogCategory, metadata?: Record<string, unknown>): void {
    this.log('warn', message, category, metadata);
  }

  error(message: string, category: LogCategory, metadata?: Record<string, unknown>): void {
    this.log('error', message, category, metadata);
  }

  // Auto-flush on page unload
  setupUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Also flush periodically
    setInterval(() => {
      if (this.batch.length > 0) {
        this.flush();
      }
    }, 30000); // Every 30 seconds
  }
}

export const loggerClient = new LoggerClient();

// Setup unload handler
loggerClient.setupUnloadHandler();
