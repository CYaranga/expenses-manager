import { LogCategories } from '@expenses-manager/shared';
import { loggerClient } from './client';
import { getPageInfo } from './utils';

/**
 * Activity Logger for tracking user actions and page views
 */
class ActivityLogger {
  trackPageView(pageName: string, metadata?: Record<string, unknown>): void {
    loggerClient.info(`Page viewed: ${pageName}`, LogCategories.PAGE_VIEW, {
      page: pageName,
      ...getPageInfo(),
      ...metadata,
    });
  }

  trackButtonClick(buttonName: string, context?: Record<string, unknown>): void {
    loggerClient.info(`Button clicked: ${buttonName}`, LogCategories.USER_ACTION, {
      action: 'click',
      element: buttonName,
      ...getPageInfo(),
      ...context,
    });
  }

  trackFormSubmit(
    formName: string,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    loggerClient.log(
      success ? 'info' : 'warn',
      `Form submitted: ${formName}`,
      LogCategories.FORM,
      {
        form: formName,
        success,
        ...getPageInfo(),
        ...metadata,
      }
    );
  }

  trackFeatureUse(featureName: string, metadata?: Record<string, unknown>): void {
    loggerClient.info(`Feature used: ${featureName}`, LogCategories.FEATURE, {
      feature: featureName,
      ...getPageInfo(),
      ...metadata,
    });
  }

  trackNavigation(from: string, to: string, metadata?: Record<string, unknown>): void {
    loggerClient.info(`Navigation: ${from} → ${to}`, LogCategories.UI, {
      from,
      to,
      navigation: true,
      ...metadata,
    });
  }

  trackModalOpen(modalName: string, metadata?: Record<string, unknown>): void {
    loggerClient.debug(`Modal opened: ${modalName}`, LogCategories.UI, {
      modal: modalName,
      action: 'open',
      ...metadata,
    });
  }

  trackModalClose(modalName: string, metadata?: Record<string, unknown>): void {
    loggerClient.debug(`Modal closed: ${modalName}`, LogCategories.UI, {
      modal: modalName,
      action: 'close',
      ...metadata,
    });
  }

  trackSearch(query: string, resultCount?: number, metadata?: Record<string, unknown>): void {
    loggerClient.info('Search performed', LogCategories.USER_ACTION, {
      query,
      resultCount,
      action: 'search',
      ...metadata,
    });
  }

  trackFilter(filterType: string, value: unknown, metadata?: Record<string, unknown>): void {
    loggerClient.debug('Filter applied', LogCategories.USER_ACTION, {
      filterType,
      value,
      action: 'filter',
      ...metadata,
    });
  }

  trackExpenseCreated(expenseData: Record<string, unknown>): void {
    loggerClient.info('Expense created', LogCategories.EXPENSE, {
      ...expenseData,
      action: 'create',
    });
  }

  trackExpenseUpdated(expenseId: string, changes: Record<string, unknown>): void {
    loggerClient.info(`Expense updated: ${expenseId}`, LogCategories.EXPENSE, {
      expenseId,
      changes,
      action: 'update',
    });
  }

  trackExpenseDeleted(expenseId: string, metadata?: Record<string, unknown>): void {
    loggerClient.warn(`Expense deleted: ${expenseId}`, LogCategories.EXPENSE, {
      expenseId,
      action: 'delete',
      ...metadata,
    });
  }

  trackFamilyAction(
    action: 'create' | 'join' | 'leave' | 'update',
    familyData?: Record<string, unknown>
  ): void {
    loggerClient.info(`Family ${action}`, LogCategories.FAMILY, {
      action,
      ...familyData,
    });
  }
}

export const activityLogger = new ActivityLogger();
