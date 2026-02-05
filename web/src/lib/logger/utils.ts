import type { LogLevel } from '@expenses-manager/shared';
import { loggerConfig } from './config';

const SENSITIVE_KEYS = [
  'password',
  'password_hash',
  'credit_card',
  'card_number',
  'cvv',
  'ssn',
  'token',
  'secret',
  'api_key',
  'apikey',
  'authorization',
  'auth',
  'private_key',
  'access_token',
  'refresh_token',
];

/**
 * Sanitize metadata to remove sensitive information
 */
export function sanitizeMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const sanitized = { ...metadata };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeMetadata(sanitized[key] as Record<string, unknown>);
    }
  }

  return sanitized;
}

/**
 * Get device information
 */
export function getDeviceInfo(): Record<string, unknown> {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    connection: (navigator as any).connection?.effectiveType || 'unknown',
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Get session/device ID
 */
export function getDeviceId(): string {
  const DEVICE_ID_KEY = 'device_id';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Check if log level should be logged based on config
 */
export function shouldLog(level: LogLevel): boolean {
  if (!loggerConfig.enabled) {
    return false;
  }

  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const minLevelIndex = levels.indexOf(loggerConfig.minLevel);
  const currentLevelIndex = levels.indexOf(level);

  return currentLevelIndex >= minLevelIndex;
}

/**
 * Format error for logging
 */
export function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    error: String(error),
  };
}

/**
 * Truncate large strings to prevent excessive log sizes
 */
export function truncate(value: unknown, maxLength: number = 1000): unknown {
  if (typeof value === 'string' && value.length > maxLength) {
    return value.substring(0, maxLength) + '... [truncated]';
  }

  if (typeof value === 'object' && value !== null) {
    const str = JSON.stringify(value);
    if (str.length > maxLength) {
      return JSON.parse(str.substring(0, maxLength) + '}');
    }
  }

  return value;
}

/**
 * Get current page/route information
 */
export function getPageInfo(): Record<string, unknown> {
  return {
    url: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    referrer: document.referrer,
    title: document.title,
  };
}
