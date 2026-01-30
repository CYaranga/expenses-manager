import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useExpenseSummary } from '../hooks/useExpenses';
import { useFamily } from '../hooks/useFamily';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';

const COLORS_LIGHT = [
  '#1A3263',
  '#547792',
  '#FAB95B',
  '#3b82f6',
  '#22c55e',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
];

const COLORS_DARK = [
  '#FAB95B',
  '#829ab1',
  '#22c55e',
  '#60a5fa',
  '#f472b6',
  '#fb923c',
  '#a78bfa',
  '#2dd4bf',
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const { data: familyData, isLoading: familyLoading, error: familyError } = useFamily();
  const { data: summaryData, isLoading: summaryLoading } = useExpenseSummary();

  const hasFamily = !!user?.family_id;
  const COLORS = theme === 'dark' ? COLORS_DARK : COLORS_LIGHT;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: familyData?.family.currency || 'USD',
    }).format(amount);
  };

  const monthlyChartData = useMemo(() => {
    if (!summaryData?.summary.monthly_totals) return [];
    return summaryData.summary.monthly_totals.map((item) => ({
      month: new Date(item.month + '-01').toLocaleDateString('en-US', {
        month: 'short',
      }),
      total: item.total,
    }));
  }, [summaryData]);

  const categoryChartData = useMemo(() => {
    if (!summaryData?.summary.category_breakdown) return [];
    return summaryData.summary.category_breakdown.slice(0, 8);
  }, [summaryData]);

  if (!hasFamily) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8 sm:py-12 px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-primary-700 dark:text-cream-100 mb-4">
          Welcome to Expenses Manager
        </h1>
        <p className="text-primary-500 dark:text-cream-300 mb-6 sm:mb-8">
          You're not part of a family yet. Create a new family or join an existing one to start tracking expenses.
        </p>
        <Link to="/family" className="btn-accent">
          Set up your family
        </Link>
      </div>
    );
  }

  if (familyLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-accent-400"></div>
      </div>
    );
  }

  if (familyError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Failed to load dashboard data.</p>
      </div>
    );
  }

  const summary = summaryData?.summary;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-700 dark:text-cream-100">Dashboard</h1>
          <p className="text-primary-500 dark:text-cream-300 mt-1 text-sm sm:text-base">
            {familyData?.family.name}'s expense overview
          </p>
        </div>
        <Link to="/expenses/new" className="btn-accent text-center sm:w-auto">
          + Add Expense
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="card">
          <p className="text-sm font-medium text-primary-500 dark:text-cream-300">Total Expenses</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary-700 dark:text-cream-100 mt-2">
            {formatCurrency(summary?.total_amount || 0)}
          </p>
          <p className="text-sm text-primary-400 dark:text-cream-400 mt-1">
            {summary?.expense_count || 0} transactions
          </p>
        </div>

        <div className="card">
          <p className="text-sm font-medium text-primary-500 dark:text-cream-300">This Month</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary-700 dark:text-cream-100 mt-2">
            {formatCurrency(
              monthlyChartData[monthlyChartData.length - 1]?.total || 0
            )}
          </p>
          <p className="text-sm text-primary-400 dark:text-cream-400 mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="card sm:col-span-2 lg:col-span-1">
          <p className="text-sm font-medium text-primary-500 dark:text-cream-300">Top Category</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary-700 dark:text-cream-100 mt-2 truncate">
            {categoryChartData[0]?.category || 'N/A'}
          </p>
          <p className="text-sm text-primary-400 dark:text-cream-400 mt-1">
            {categoryChartData[0]
              ? formatCurrency(categoryChartData[0].total)
              : 'No expenses yet'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly trend */}
        <div className="card">
          <h2 className="text-base sm:text-lg font-semibold text-primary-700 dark:text-cream-100 mb-4">
            Monthly Spending
          </h2>
          {monthlyChartData.length > 0 ? (
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#3d5a73' : '#E8E2DB'} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: theme === 'dark' ? '#d9e2ec' : '#547792' }} />
                  <YAxis tick={{ fontSize: 12, fill: theme === 'dark' ? '#d9e2ec' : '#547792' }} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Total']}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1A3263' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#3d5a73' : '#E8E2DB'}`,
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#f9f6f3' : '#1A3263',
                    }}
                  />
                  <Bar dataKey="total" fill="#FAB95B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 sm:h-64 flex items-center justify-center text-primary-400 dark:text-cream-400">
              No data available
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="card">
          <h2 className="text-base sm:text-lg font-semibold text-primary-700 dark:text-cream-100 mb-4">
            By Category
          </h2>
          {categoryChartData.length > 0 ? (
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ category, percent }) =>
                      `${category.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1A3263' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#3d5a73' : '#E8E2DB'}`,
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#f9f6f3' : '#1A3263',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 sm:h-64 flex items-center justify-center text-primary-400 dark:text-cream-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Recent expenses */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-primary-700 dark:text-cream-100">
            Recent Expenses
          </h2>
          <Link
            to="/expenses"
            className="text-sm text-accent-500 hover:text-accent-600 font-medium"
          >
            View all
          </Link>
        </div>

        {summary?.recent_expenses && summary.recent_expenses.length > 0 ? (
          <div className="divide-y divide-cream-200 dark:divide-primary-700 -mx-4 sm:-mx-6 px-4 sm:px-6">
            {summary.recent_expenses.map((expense) => (
              <div
                key={expense.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-primary-700 dark:text-cream-100 truncate">{expense.name}</p>
                  <p className="text-sm text-primary-400 dark:text-cream-400 truncate">
                    {expense.category} &middot;{' '}
                    {new Date(expense.purchase_date).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-semibold text-primary-700 dark:text-cream-100 flex-shrink-0">
                  {formatCurrency(expense.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-primary-400 dark:text-cream-400 text-center py-8">
            No expenses yet.{' '}
            <Link to="/expenses/new" className="text-accent-500 hover:underline">
              Add your first expense
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
