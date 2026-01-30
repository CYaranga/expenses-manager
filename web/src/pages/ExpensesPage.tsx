import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useExpenses, useDeleteExpense, useCategories } from '../hooks/useExpenses';
import { useFamily } from '../hooks/useFamily';
import { useAuthStore } from '../store/auth.store';
import type { ExpenseFilters } from '../../../shared/src';

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const { data: familyData } = useFamily();
  const { data: categoriesData } = useCategories();
  const deleteExpense = useDeleteExpense();

  const [filters, setFilters] = useState<ExpenseFilters>({
    limit: 20,
    offset: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useExpenses(filters);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: familyData?.family.currency || 'USD',
    }).format(amount);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteExpense.mutateAsync(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete expense');
      }
    }
  };

  const handleFilterChange = (key: keyof ExpenseFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      offset: 0,
    }));
  };

  const totalPages = useMemo(() => {
    if (!data) return 0;
    return Math.ceil(data.total / (filters.limit || 20));
  }, [data, filters.limit]);

  const currentPage = useMemo(() => {
    return Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  }, [filters.offset, filters.limit]);

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
    return (
      <div className="text-center py-12 px-4">
        <p className="text-primary-500">
          Please join or create a family to track expenses.
        </p>
        <Link to="/family" className="btn-accent mt-4 inline-block">
          Set up family
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-primary-700">Expenses</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex-1 sm:flex-none"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          <Link to="/expenses/new" className="btn-accent flex-1 sm:flex-none text-center">
            + Add
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input"
              >
                <option value="">All categories</option>
                {categoriesData?.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Start date</label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">End date</label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="input"
              />
            </div>

            <div className="flex items-end">
              <button onClick={clearFilters} className="btn-secondary w-full">
                Clear filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load expenses.</p>
        </div>
      ) : data?.expenses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-primary-400">No expenses found.</p>
          <Link
            to="/expenses/new"
            className="text-accent-500 hover:underline mt-2 inline-block"
          >
            Add your first expense
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="sm:hidden space-y-3">
            {data?.expenses.map((expense) => (
              <div key={expense.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-primary-700 truncate">{expense.name}</p>
                    <p className="text-sm text-primary-500">{expense.category}</p>
                    <p className="text-xs text-primary-400 mt-1">
                      {new Date(expense.purchase_date).toLocaleDateString()} &middot;{' '}
                      {expense.user_display_name || expense.user_email}
                    </p>
                  </div>
                  <p className="font-semibold text-primary-700 text-lg">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-cream-200">
                  <Link
                    to={`/expenses/${expense.id}/edit`}
                    className="btn-secondary text-sm py-1.5 flex-1"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(expense.id, expense.name)}
                    className="btn-danger text-sm py-1.5 flex-1"
                    disabled={deleteExpense.isPending}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-100 border-b border-cream-300">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider hidden lg:table-cell">
                      Date
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider hidden lg:table-cell">
                      Added by
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  {data?.expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-cream-50">
                      <td className="px-4 lg:px-6 py-4">
                        <div>
                          <p className="font-medium text-primary-700 truncate max-w-[200px]">
                            {expense.name}
                          </p>
                          {expense.place && (
                            <p className="text-sm text-primary-400 truncate max-w-[200px]">{expense.place}</p>
                          )}
                          <p className="text-xs text-primary-400 lg:hidden mt-1">
                            {new Date(expense.purchase_date).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-primary-500 hidden lg:table-cell">
                        {new Date(expense.purchase_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-primary-500 hidden lg:table-cell">
                        {expense.user_display_name || expense.user_email}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right font-semibold text-primary-700">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          to={`/expenses/${expense.id}/edit`}
                          className="text-accent-500 hover:text-accent-600 mr-3"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(expense.id, expense.name)}
                          className="text-red-600 hover:text-red-700"
                          disabled={deleteExpense.isPending}
                        >
                          Delete
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
              <p className="text-sm text-primary-500 text-center sm:text-left">
                Showing {(filters.offset || 0) + 1} to{' '}
                {Math.min(
                  (filters.offset || 0) + (filters.limit || 20),
                  data?.total || 0
                )}{' '}
                of {data?.total || 0}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-primary-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
