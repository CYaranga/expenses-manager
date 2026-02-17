import { useState } from 'react';
import { useExpenses, useDeleteExpense, useCategories } from '../hooks/useExpenses';
import { useFamily } from '../hooks/useFamily';
import { useAuthStore } from '../store/auth.store';
import { useTranslation } from '../hooks/useTranslation';
import AddExpenseModal from '../components/AddExpenseModal';
import CalendarHeatmap from '../components/CalendarHeatmap';
import DashboardSummary from '../components/DashboardSummary';
import FamilySetup from '../components/FamilySetup';
import type { ExpenseFilters, ExpenseWithUser } from '../../../shared/src';
import { activityLogger, errorLogger } from '../lib/logger';

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const { data: familyData } = useFamily();
  const { data: categoriesData } = useCategories();
  const deleteExpense = useDeleteExpense();
  const { t, tc, formatCurrency: formatCurrencyLocale } = useTranslation();

  const [activeTab, setActiveTab] = useState<'table' | 'calendar'>('table');
  const [filters, setFilters] = useState<ExpenseFilters>({
    limit: 20,
    offset: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithUser | null>(null);

  const { data, isLoading, error } = useExpenses(filters);

  const currency = familyData?.family.currency || 'USD';
  const formatCurrency = (amount: number) => formatCurrencyLocale(amount, currency);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`${t('deleteConfirm')} "${name}"?`)) {
      try {
        activityLogger.trackExpenseDeleted(id, { name });
        await deleteExpense.mutateAsync(id);
      } catch (err) {
        errorLogger.logError(err, {
          action: 'delete-expense',
          expenseId: id,
          expenseName: name,
        });
        alert(err instanceof Error ? err.message : t('failedToDelete'));
      }
    }
  };

  const handleEdit = (expense: ExpenseWithUser) => {
    activityLogger.trackModalOpen('EditExpense', { expenseId: expense.id });
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleAdd = () => {
    activityLogger.trackButtonClick('AddExpense');
    activityLogger.trackModalOpen('AddExpense');
    setEditingExpense(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingExpense(null);
  };

  const handleFilterChange = (key: keyof ExpenseFilters, value: string) => {
    activityLogger.trackFilter(key, value);
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      offset: 0,
    }));
  };

  const totalPages = data ? Math.ceil(data.total / (filters.limit || 20)) : 0;

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      offset: (page - 1) * (prev.limit || 20),
    }));
  };

  const clearFilters = () => {
    setFilters({ limit: 20, offset: 0 });
    setShowFilters(false);
  };

  if (!user?.family_id) {
    return <FamilySetup />;
  }

  const amountColor = (expense: ExpenseWithUser) =>
    expense.type === 'income'
      ? 'text-green-600 dark:text-green-400'
      : 'text-primary-700 dark:text-cream-100';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dashboard Summary */}
      <DashboardSummary />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-primary-700 dark:text-cream-100">{t('expenses')}</h1>
        <div className="flex gap-2">
          {activeTab === 'table' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex-1 sm:flex-none"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {t('filters')}
            </button>
          )}
          <button onClick={handleAdd} className="btn-accent flex-1 sm:flex-none">
            + {t('addExpense')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cream-300 dark:border-primary-700">
        <button
          onClick={() => setActiveTab('table')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'table'
              ? 'border-accent-500 text-accent-500'
              : 'border-transparent text-primary-400 dark:text-cream-400 hover:text-primary-600 dark:hover:text-cream-200'
          }`}
        >
          {t('table')}
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'calendar'
              ? 'border-accent-500 text-accent-500'
              : 'border-transparent text-primary-400 dark:text-cream-400 hover:text-primary-600 dark:hover:text-cream-200'
          }`}
        >
          {t('calendar')}
        </button>
      </div>

      {/* Calendar tab */}
      {activeTab === 'calendar' && <CalendarHeatmap />}

      {/* Table tab */}
      {activeTab === 'table' && (
      <>
      {/* Filters */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="label">{t('type')}</label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input"
              >
                <option value="">{t('allTypes')}</option>
                <option value="expense">{t('expense')}</option>
                <option value="income">{t('income')}</option>
              </select>
            </div>

            <div>
              <label className="label">{t('category')}</label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input"
              >
                <option value="">{t('allCategories')}</option>
                {categoriesData?.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {tc(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('startDate')}</label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">{t('endDate')}</label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="input"
              />
            </div>

            <div className="flex items-end">
              <button onClick={clearFilters} className="btn-secondary w-full">
                {t('clearFilters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-accent-400"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{t('failedToLoad')}</p>
        </div>
      ) : data?.expenses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-primary-400 dark:text-cream-400">{t('noExpensesFound')}</p>
          <button
            onClick={handleAdd}
            className="text-accent-500 hover:underline mt-2 inline-block"
          >
            {t('addFirstExpense')}
          </button>
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="sm:hidden space-y-3">
            {data?.expenses.map((expense) => (
              <div key={expense.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-primary-700 dark:text-cream-100 truncate">{expense.name}</p>
                      {expense.type === 'income' && (
                        <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          {t('income')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-primary-500 dark:text-cream-300">{tc(expense.category)}</p>
                    <p className="text-xs text-primary-400 dark:text-cream-400 mt-1">
                      {new Date(expense.purchase_date).toLocaleDateString()} &middot;{' '}
                      {expense.user_display_name || expense.user_email}
                    </p>
                  </div>
                  <p className={`font-semibold font-mono tabular-nums text-lg ${amountColor(expense)}`}>
                    {expense.type === 'income' ? '+' : ''}{formatCurrency(expense.amount)}
                  </p>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-cream-200 dark:border-primary-700">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="btn-secondary text-sm py-1.5 flex-1"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id, expense.name)}
                    className="btn-danger text-sm py-1.5 flex-1"
                    disabled={deleteExpense.isPending}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-100 dark:bg-primary-900 border-b border-cream-300 dark:border-primary-700">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-primary-500 dark:text-cream-300 uppercase tracking-wider">
                      {t('name')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-primary-500 dark:text-cream-300 uppercase tracking-wider">
                      {t('category')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-primary-500 dark:text-cream-300 uppercase tracking-wider hidden lg:table-cell">
                      {t('date')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-primary-500 dark:text-cream-300 uppercase tracking-wider hidden lg:table-cell">
                      {t('addedBy')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-primary-500 dark:text-cream-300 uppercase tracking-wider">
                      {t('amount')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-primary-500 dark:text-cream-300 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 dark:divide-primary-700">
                  {data?.expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-cream-50 dark:hover:bg-primary-700/50">
                      <td className="px-4 lg:px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-primary-700 dark:text-cream-100 truncate max-w-[200px]">
                              {expense.name}
                            </p>
                            {expense.type === 'income' && (
                              <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                {t('income')}
                              </span>
                            )}
                          </div>
                          {expense.place && (
                            <p className="text-sm text-primary-400 dark:text-cream-400 truncate max-w-[200px]">{expense.place}</p>
                          )}
                          <p className="text-xs text-primary-400 dark:text-cream-400 lg:hidden mt-1">
                            {new Date(expense.purchase_date).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-700 text-primary-700 dark:text-cream-200">
                          {tc(expense.category)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-primary-500 dark:text-cream-300 hidden lg:table-cell">
                        {new Date(expense.purchase_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-primary-500 dark:text-cream-300 hidden lg:table-cell">
                        {expense.user_display_name || expense.user_email}
                      </td>
                      <td className={`px-4 lg:px-6 py-4 whitespace-nowrap text-right font-semibold font-mono tabular-nums ${amountColor(expense)}`}>
                        {expense.type === 'income' ? '+' : ''}{formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-accent-500 hover:text-accent-600 mr-3"
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id, expense.name)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          disabled={deleteExpense.isPending}
                        >
                          {t('delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-primary-500 dark:text-cream-300 text-center sm:text-left">
                {t('showing')} {(filters.offset || 0) + 1} {t('to')}{' '}
                {Math.min(
                  (filters.offset || 0) + (filters.limit || 20),
                  data?.total || 0
                )}{' '}
                {t('of')} {data?.total || 0}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  {t('previous')}
                </button>
                <span className="px-3 py-1.5 text-sm text-primary-600 dark:text-cream-200">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  {t('next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      </>
      )}

      <AddExpenseModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        expense={editingExpense}
      />
    </div>
  );
}
