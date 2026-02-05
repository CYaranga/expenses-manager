# Logger Integration Guide

This document describes the comprehensive logging system integrated into the Expenses Manager application using the Private Logger API.

## Overview

The application now has a full-featured logging system that tracks:
- User authentication events
- API requests and responses
- User actions and interactions
- Errors and exceptions
- Performance metrics
- Page views and navigation

## Setup

### 1. Environment Configuration

Add the following to your `web/.env` file:

```env
VITE_LOGGER_API_URL=https://private-logger-api.christian-yaranga-05.workers.dev
VITE_LOGGER_USERNAME=your_username
VITE_LOGGER_PASSWORD=your_password
```

### 2. Logger Architecture

The logger system consists of several specialized components:

#### Core Components

- **`loggerClient`** - Main logging client with batching and retry logic
- **`loggerAuth`** - Handles authentication with the logger API
- **`offlineQueue`** - Stores logs when offline for later transmission
- **`activityLogger`** - Tracks user actions and interactions
- **`errorLogger`** - Captures errors and exceptions
- **`performanceMonitor`** - Measures and logs performance metrics
- **`apiLogger`** - Logs all API requests and responses

#### Configuration

Located in `web/src/lib/logger/config.ts`:

```typescript
{
  enabled: true,              // Enable/disable logging
  minLevel: 'debug',          // Minimum log level (debug/info/warn/error)
  logToConsole: true,         // Also log to browser console (dev only)
  batchSize: 10,              // Number of logs to batch before sending
  batchTimeout: 5000,         // Max time to wait before sending batch (ms)
  maxQueueSize: 100,          // Max offline queue size
  retries: 3,                 // Number of retry attempts
  retryDelay: 1000,           // Delay between retries (ms)
}
```

## What's Being Logged

### 1. Authentication Events

```typescript
// Login attempts
logger.client.info('Google sign-in initiated', LogCategories.AUTH);
logger.client.info('Google sign-in successful', LogCategories.AUTH, {
  userId: user.id,
  email: user.email,
});

// Logout
logger.client.info('Logout initiated', LogCategories.AUTH);

// Auth errors
logger.error.logAuthError('google-sign-in', error);
```

### 2. API Calls

All API requests are automatically logged with:
- HTTP method and endpoint
- Request and response data (sanitized)
- Status code
- Response time
- Success/failure status

```typescript
// Example automatic log
apiLogger.logResponse('POST', '/expenses', 201, responseData, 245);
```

### 3. User Actions

```typescript
// Expense actions
activityLogger.trackExpenseCreated({ name, amount, category });
activityLogger.trackExpenseUpdated(expenseId, changes);
activityLogger.trackExpenseDeleted(expenseId);

// UI interactions
activityLogger.trackButtonClick('AddExpense');
activityLogger.trackModalOpen('EditExpense');
activityLogger.trackFilter('category', 'Food');

// Page views
activityLogger.trackPageView('Expenses', { path: '/expenses' });
activityLogger.trackNavigation('/login', '/');
```

### 4. Errors

All errors are automatically caught and logged:

```typescript
// Application errors
errorLogger.logError(error, { context: 'additional info' });

// API errors
errorLogger.logApiError('POST', '/expenses', 500, error);

// Validation errors
errorLogger.logValidationError('amount', value, 'Must be positive');

// Unhandled errors (automatic)
// Global error handlers capture all unhandled errors and promise rejections
```

### 5. Performance Metrics

```typescript
// Track slow operations
performanceMonitor.startTimer('expenseList');
// ... operation ...
performanceMonitor.endTimer('expenseList');

// Measure async operations
const result = await performanceMonitor.measureAsync(
  'loadExpenses',
  async () => await fetchExpenses()
);

// API response times (automatic)
performanceMonitor.logApiResponseTime('/expenses', 'GET', 245, 200);
```

### 6. Page Views and Navigation

Automatically tracked via `RouteTracker` component in `App.tsx`:

```typescript
// Page view
activityLogger.trackPageView('Expenses', {
  path: '/expenses',
  search: '?category=Food',
});

// Navigation
activityLogger.trackNavigation('/login', '/expenses');
```

## Log Categories

The system uses predefined categories for better organization:

```typescript
export const LogCategories = {
  AUTH: 'AUTH',              // Authentication events
  API: 'API',                // API calls
  DATABASE: 'DATABASE',      // Database operations
  UI: 'UI',                  // UI interactions
  PERFORMANCE: 'PERFORMANCE', // Performance metrics
  ERROR: 'ERROR',            // Errors
  SECURITY: 'SECURITY',      // Security events
  USER_ACTION: 'USER_ACTION', // User actions
  PAGE_VIEW: 'PAGE_VIEW',    // Page views
  FORM: 'FORM',              // Form submissions
  FEATURE: 'FEATURE',        // Feature usage
  DEBUG: 'DEBUG',            // Debug info
  EXPENSE: 'EXPENSE',        // Expense operations
  FAMILY: 'FAMILY',          // Family operations
  GENERAL: 'GENERAL',        // General logs
};
```

## Data Privacy

### Automatic Sanitization

Sensitive data is automatically redacted:

```typescript
const SENSITIVE_KEYS = [
  'password',
  'password_hash',
  'credit_card',
  'cvv',
  'token',
  'secret',
  'api_key',
  'authorization',
  'access_token',
  'refresh_token',
];

// Example
{
  email: 'user@example.com',     // ✅ Logged
  password: 'secret123',          // ❌ Becomes '[REDACTED]'
  amount: 99.99,                  // ✅ Logged
  api_key: 'sk_live_abc123',      // ❌ Becomes '[REDACTED]'
}
```

### Data Truncation

Large data is automatically truncated to prevent excessive log sizes (max 1000 characters).

## Offline Support

The logger includes an offline queue that:
- Stores logs when the device is offline
- Automatically sends queued logs when connection is restored
- Has a maximum queue size of 100 logs (oldest are dropped when full)
- Persists to localStorage for reliability

## Integration Points

### Locations Where Logging Is Active

1. **Authentication** (`store/auth.store.ts`)
   - Login attempts and success/failure
   - Logout events
   - Auth checks

2. **API Client** (`lib/api.ts`)
   - All HTTP requests
   - Response times
   - Error tracking

3. **Expenses Page** (`pages/ExpensesPage.tsx`)
   - CRUD operations on expenses
   - Filter changes
   - Pagination

4. **Expense Modal** (`components/AddExpenseModal.tsx`)
   - Form submissions
   - Validation errors
   - Modal open/close

5. **App Component** (`App.tsx`)
   - Page views
   - Navigation tracking

6. **Global Handlers**
   - Unhandled errors
   - Promise rejections
   - Page unload

## Usage Examples

### Basic Logging

```typescript
import { logger, LogCategories } from '../lib/logger';

// Simple log
logger.client.info('Operation completed', LogCategories.GENERAL);

// With metadata
logger.client.info('User updated profile', LogCategories.USER_ACTION, {
  userId: '123',
  fields: ['name', 'email'],
});

// Error logging
try {
  await riskyOperation();
} catch (error) {
  logger.error.logError(error, {
    context: 'riskyOperation',
    additionalInfo: 'some value',
  });
}
```

### Performance Tracking

```typescript
import { performanceMonitor } from '../lib/logger';

// Simple timing
performanceMonitor.startTimer('operation');
// ... do work ...
performanceMonitor.endTimer('operation');

// Async wrapper
const result = await performanceMonitor.measureAsync(
  'fetchData',
  async () => {
    return await fetch('/api/data');
  },
  { endpoint: '/api/data' }
);
```

### Activity Tracking

```typescript
import { activityLogger } from '../lib/logger';

// Track button click
const handleClick = () => {
  activityLogger.trackButtonClick('SubmitForm', {
    formName: 'contactForm',
  });
  submitForm();
};

// Track feature usage
activityLogger.trackFeatureUse('ExportCSV', {
  rowCount: 100,
  format: 'csv',
});

// Track search
activityLogger.trackSearch('pizza', 42, {
  filters: { category: 'Food' },
});
```

## Monitoring and Analysis

### Accessing Logs

Logs are sent to the Private Logger API at:
`https://private-logger-api.christian-yaranga-05.workers.dev`

Use the API endpoints documented in `LoggerDocumentation.md` to:
- View logs with filters
- Get statistics
- Download archives
- Monitor performance

### Key Metrics to Monitor

1. **Error Rate**: Count of error-level logs
2. **API Performance**: Average response times by endpoint
3. **User Activity**: Most used features
4. **Page Performance**: Page load times
5. **Authentication**: Failed login attempts

### Example Queries

```typescript
// Get all errors from the last 24 hours
fetch('https://private-logger-api.../logs?level=error&hours=24')

// Get API performance metrics
fetch('https://private-logger-api.../logs?category=API&limit=100')

// Get user activity
fetch('https://private-logger-api.../logs?category=USER_ACTION&user_id=123')
```

## Best Practices

1. **Don't Over-Log**: Log meaningful events, not every function call
2. **Use Appropriate Levels**:
   - `debug`: Detailed diagnostic information
   - `info`: General informational messages
   - `warn`: Warning messages for potentially harmful situations
   - `error`: Error events that might still allow the app to continue

3. **Include Context**: Always add relevant metadata to logs
4. **Sanitize Data**: Never log passwords, tokens, or sensitive data
5. **Monitor Performance**: Check that logging doesn't impact app performance

## Troubleshooting

### Logs Not Appearing

1. Check environment variables are set correctly
2. Verify logger credentials with the API
3. Check browser console for authentication errors
4. Verify `loggerConfig.enabled` is `true`

### Performance Issues

1. Reduce `batchSize` if sending too many logs at once
2. Increase `batchTimeout` to batch more logs together
3. Increase `minLevel` to 'warn' or 'error' to reduce log volume

### Offline Queue Growing

1. Check network connectivity
2. Verify logger API is accessible
3. Clear queue manually if needed: `offlineQueue.clear()`

## Future Enhancements

Potential improvements:
- [ ] Session replay integration
- [ ] Advanced filtering in the UI
- [ ] Real-time log streaming
- [ ] Automated alerts for critical errors
- [ ] Performance regression detection
- [ ] Custom dashboards
- [ ] Log retention policies

## Support

For issues or questions:
- API Documentation: See `LoggerDocumentation.md`
- Logger API: https://private-logger-api.christian-yaranga-05.workers.dev
- Code: `web/src/lib/logger/`
