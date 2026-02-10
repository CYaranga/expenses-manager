import { useState, useMemo } from 'react';
import { useSummary } from '../hooks/useExpenses';
import { useFamily } from '../hooks/useFamily';
import { useTranslation } from '../hooks/useTranslation';
import {
  getWeekStart,
  getWeekEnd,
  getMonthStartStr,
  getMonthEndStr,
  getYearStartStr,
  getYearEndStr,
} from '../lib/date-utils';

type Period = 'week' | 'month' | 'year' | 'custom';

const PERIODS: { key: Period; labelKey: string }[] = [
  { key: 'week',   labelKey: 'thisWeek'   },
  { key: 'month',  labelKey: 'thisMonth'  },
  { key: 'year',   labelKey: 'thisYear'   },
  { key: 'custom', labelKey: 'custom'     },
];

export default function DashboardSummary() {
  const { t, tc, formatCurrency: formatCurrencyLocale } = useTranslation();
  const { data: familyData } = useFamily();
  const currency = familyData?.family.currency || 'USD';

  const [period, setPeriod] = useState<Period>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const today = new Date();

  const { startDate, endDate } = useMemo(() => {
    switch (period) {
      case 'week':
        return { startDate: getWeekStart(today), endDate: getWeekEnd(today) };
      case 'month':
        return { startDate: getMonthStartStr(today), endDate: getMonthEndStr(today) };
      case 'year':
        return { startDate: getYearStartStr(today), endDate: getYearEndStr(today) };
      case 'custom':
        return { startDate: customStart, endDate: customEnd };
    }
  }, [period, customStart, customEnd]);

  const { data, isLoading } = useSummary(startDate, endDate);
  const summary = data?.summary;

  const fmt = (amount: number) => formatCurrencyLocale(amount, currency);

  const netBalance = summary?.net_balance || 0;
  const netBalancePositive = netBalance >= 0;

  return (
    <div className="card p-0 overflow-hidden">
      {/* Period bar */}
      <div className="px-4 sm:px-6 py-3 bg-cream-50 dark:bg-primary-900/40 border-b border-cream-200 dark:border-primary-700 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-primary-400 dark:text-cream-500">
          {t('period')}
        </span>

        <div className="flex rounded-lg border border-cream-300 dark:border-primary-600 overflow-hidden">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                period === p.key
                  ? 'bg-accent-500 text-white'
                  : 'text-primary-600 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-primary-700'
              }`}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="input py-1 px-2 text-xs"
            />
            <span className="text-primary-400 dark:text-cream-500 text-xs">—</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="input py-1 px-2 text-xs"
            />
          </div>
        )}
      </div>

      {/* Stats body */}
      <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-0">
        {/* Hero: Net Balance */}
        <div className="sm:flex-1 sm:pr-6 sm:border-r sm:border-cream-200 dark:sm:border-primary-700">
          <p className="text-xs font-medium uppercase tracking-widest text-primary-400 dark:text-cream-500 mb-2">
            {t('netBalance')}
          </p>
          <p
            className={`font-display text-4xl sm:text-5xl font-bold tabular-nums leading-none ${
              netBalancePositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isLoading ? '—' : fmt(netBalance)}
          </p>
        </div>

        {/* Supporting metrics */}
        <div className="sm:pl-6 grid grid-cols-3 sm:grid-cols-1 gap-4 sm:gap-3 sm:w-56">
          {/* Expenses */}
          <div>
            <p className="text-xs uppercase tracking-wider text-primary-400 dark:text-cream-500 mb-0.5">
              {t('totalExpenses')}
            </p>
            <p className="font-mono text-base sm:text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
              {isLoading ? '—' : fmt(summary?.total_expenses || 0)}
            </p>
          </div>

          {/* Income */}
          <div>
            <p className="text-xs uppercase tracking-wider text-primary-400 dark:text-cream-500 mb-0.5">
              {t('totalIncome')}
            </p>
            <p className="font-mono text-base sm:text-lg font-semibold tabular-nums text-green-600 dark:text-green-400">
              {isLoading ? '—' : fmt(summary?.total_income || 0)}
            </p>
          </div>

          {/* Top Category */}
          <div>
            <p className="text-xs uppercase tracking-wider text-primary-400 dark:text-cream-500 mb-0.5">
              {t('topCategory')}
            </p>
            <p className="text-base sm:text-lg font-semibold truncate text-primary-700 dark:text-cream-100">
              {isLoading
                ? '—'
                : summary?.top_category
                ? tc(summary.top_category)
                : t('noData')}
            </p>
            {!isLoading && summary?.top_category && (
              <p className="font-mono text-xs tabular-nums text-primary-400 dark:text-cream-500">
                {fmt(summary.top_category_amount)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
