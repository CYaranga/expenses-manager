import type { CreateLogInput } from '@expenses-manager/shared';
import { loggerConfig } from './config';

const STORAGE_KEY = 'offline_log_queue';

class OfflineLogQueue {
  private queue: CreateLogInput[] = [];

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.flush();
    });
  }

  add(log: CreateLogInput): void {
    if (this.queue.length >= loggerConfig.maxQueueSize) {
      this.queue.shift(); // Remove oldest
    }

    this.queue.push(log);
    this.saveQueue();
  }

  getAll(): CreateLogInput[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
    this.saveQueue();
  }

  remove(log: CreateLogInput): void {
    const index = this.queue.indexOf(log);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveQueue();
    }
  }

  flush(): void {
    // This will be called by the logger service
    // We don't flush automatically here to avoid circular dependencies
  }

  get size(): number {
    return this.queue.length;
  }

  get isOnline(): boolean {
    return navigator.onLine;
  }
}

export const offlineQueue = new OfflineLogQueue();
