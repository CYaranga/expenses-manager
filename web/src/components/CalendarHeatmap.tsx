import { useState, useMemo, useCallback } from 'react';
import { useDailyTotals, useExpensesByDateRange } from '../hooks/useExpenses';
import { useFamily } from '../hooks/useFamily';
import { useTranslation } from '../hooks/useTranslation';
import { toDateStr, parseDate, addDays, getMonday, getMonthStart, getMonthEnd, isSameDay } from '../lib/date-utils';
import type { ExpenseWithUser } from '../../../shared/src';

type ViewMode = 'week' | 'month' | 'year';

const MONTH_KEYS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
const MONTH_SHORT_KEYS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function getColorLevel(amount: number, max: number): number {
  if (amount === 0) return 0;
  if (max === 0) return 0;
  const ratio = amount / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const LEVEL_CLASSES = [
  'bg-cream-200 dark:bg-primary-700',
  'bg-accent-200 dark:bg-accent-900',
  'bg-accent-300 dark:bg-accent-700',
  'bg-accent-400 dark:bg-accent-500',
  'bg-accent-500 dark:bg-accent-400',
];

const LEVEL_BORDER_CLASSES = [
  'border-l-cream-300 dark:border-l-primary-600',
  'border-l-accent-200 dark:border-l-accent-900',
  'border-l-accent-300 dark:border-l-accent-700',
  'border-l-accent-400 dark:border-l-accent-500',
  'border-l-accent-500 dark:border-l-accent-400',
];

// --- Arrow icons (module-level JSX constants — no props, no re-creation on render) ---

const CHEVRON_LEFT = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const CHEVRON_RIGHT = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ============================================================
// Annual View
// ============================================================

function AnnualView({ year, formatCurrency, t }: { year: number; formatCurrency: (n: number) => string; t: (key: any) => string }) {
  const { data, isLoading, error } = useDailyTotals(year);

  const totalsMap = useMemo(() => {
    const map = new Map<string, number>();
    if (data?.dailyTotals) {
      for (const dt of data.dailyTotals) {
        map.set(dt.date, dt.total);
      }
    }
    return map;
  }, [data]);

  const { maxAmount, yearTotal } = useMemo(() => {
    let max = 0;
    let sum = 0;
    totalsMap.forEach((v) => {
      if (v > max) max = v;
      sum += v;
    });
    return { maxAmount: max, yearTotal: sum };
  }, [totalsMap]);

  if (isLoading) return LOADING_SPINNER;
  if (error) return <ErrorMessage t={t} />;

  return (
    <div className="space-y-4">
      <div className="text-right text-sm text-primary-500 dark:text-cream-300">
        {t('yearTotal')}: <span className="font-mono tabular-nums font-semibold text-primary-700 dark:text-cream-100">{formatCurrency(yearTotal)}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, monthIdx) => (
          <MiniMonth key={monthIdx} year={year} month={monthIdx} totalsMap={totalsMap} maxAmount={maxAmount} formatCurrency={formatCurrency} t={t} />
        ))}
      </div>
      <Legend t={t} />
    </div>
  );
}

function MiniMonth({
  year, month, totalsMap, maxAmount, formatCurrency, t,
}: {
  year: number; month: number; totalsMap: Map<string, number>; maxAmount: number; formatCurrency: (n: number) => string; t: (key: any) => string;
}) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  const [tooltip, setTooltip] = useState<{ date: string; amount: number } | null>(null);

  const cells: { day: number; dateStr: string; amount: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr, amount: totalsMap.get(dateStr) || 0 });
  }

  const dayLabels = DAY_KEYS.map((k) => t(`day.${k}`));

  return (
    <div className="card p-3 relative">
      <h3 className="text-xs font-semibold text-primary-600 dark:text-cream-200 mb-2">{t(`monthShort.${MONTH_SHORT_KEYS[month]}`)}</h3>
      <div className="grid grid-cols-7 gap-px text-center">
        {dayLabels.map((d: string, i: number) => (
          <div key={i} className="text-[9px] text-primary-400 dark:text-cream-500 leading-tight pb-0.5">{d[0]}</div>
        ))}
        {Array.from({ length: startOffset }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {cells.map((cell) => {
          const level = getColorLevel(cell.amount, maxAmount);
          return (
            <div
              key={cell.day}
              className={`aspect-square flex items-center justify-center text-[9px] rounded-sm cursor-default transition-opacity hover:opacity-80 ${LEVEL_CLASSES[level]} ${cell.amount > 0 ? 'font-medium text-primary-800 dark:text-cream-100' : 'text-primary-400 dark:text-cream-500'}`}
              onMouseEnter={() => setTooltip({ date: cell.dateStr, amount: cell.amount })}
              onMouseLeave={() => setTooltip(null)}
            >
              {cell.day}
            </div>
          );
        })}
      </div>
      {tooltip && (
        <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-lg bg-primary-800 dark:bg-cream-100 text-cream-100 dark:text-primary-800 whitespace-nowrap pointer-events-none">
          {new Date(tooltip.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' — '}
          {tooltip.amount > 0 ? <span className="font-mono tabular-nums">{formatCurrency(tooltip.amount)}</span> : t('noExpenses')}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Monthly View
// ============================================================

function MonthlyView({
  currentDate, formatCurrency, t,
}: {
  currentDate: Date; formatCurrency: (n: number) => string; t: (key: any) => string;
}) {
  const monthStart = getMonthStart(currentDate);
  const monthEnd = getMonthEnd(currentDate);

  const gridStart = getMonday(monthStart);
  const gridEndRaw = addDays(monthEnd, 0);
  const gridEndDay = gridEndRaw.getDay();
  const gridEnd = gridEndDay === 0 ? gridEndRaw : addDays(gridEndRaw, 7 - gridEndDay);

  const startStr = toDateStr(gridStart);
  const endStr = toDateStr(gridEnd);

  const { data, isLoading, error } = useExpensesByDateRange(startStr, endStr);

  const { expensesByDate, dailyTotals } = useMemo(() => {
    const expMap = new Map<string, ExpenseWithUser[]>();
    const totalsMap = new Map<string, number>();
    if (data?.expenses) {
      for (const exp of data.expenses) {
        const key = exp.purchase_date;
        if (!expMap.has(key)) expMap.set(key, []);
        expMap.get(key)!.push(exp);
        totalsMap.set(key, (totalsMap.get(key) || 0) + exp.amount);
      }
    }
    return { expensesByDate: expMap, dailyTotals: totalsMap };
  }, [data]);

  const { maxAmount, monthTotal } = useMemo(() => {
    let max = 0;
    let sum = 0;
    dailyTotals.forEach((v, date) => {
      if (v > max) max = v;
      const d = parseDate(date);
      if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
        sum += v;
      }
    });
    return { maxAmount: max, monthTotal: sum };
  }, [dailyTotals, currentDate]);

  const weeks: { date: Date; dateStr: string }[][] = [];
  let cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const week: { date: Date; dateStr: string }[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({ date: new Date(cursor), dateStr: toDateStr(cursor) });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  if (isLoading) return LOADING_SPINNER;
  if (error) return <ErrorMessage t={t} />;

  const today = new Date();
  const dayLabels = DAY_KEYS.map((k) => t(`day.${k}`));

  return (
    <div className="space-y-4">
      <div className="text-right text-sm text-primary-500 dark:text-cream-300">
        {t('monthTotal')}: <span className="font-mono tabular-nums font-semibold text-primary-700 dark:text-cream-100">{formatCurrency(monthTotal)}</span>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-cream-300 dark:border-primary-700">
          {dayLabels.map((d: string, i: number) => (
            <div key={i} className="px-2 py-2 text-xs font-medium text-center text-primary-500 dark:text-cream-400 uppercase">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-b-0 border-cream-200 dark:border-primary-700">
            {week.map((cell) => {
              const isCurrentMonth = cell.date.getMonth() === currentDate.getMonth();
              const isToday = isSameDay(cell.date, today);
              const expenses = expensesByDate.get(cell.dateStr) || [];
              const total = dailyTotals.get(cell.dateStr) || 0;
              const level = getColorLevel(total, maxAmount);
              const maxVisible = 3;
              const overflow = expenses.length - maxVisible;

              return (
                <div
                  key={cell.dateStr}
                  className={`min-h-[100px] sm:min-h-[120px] p-1.5 sm:p-2 border-l-[3px] border-r border-r-cream-200 dark:border-r-primary-700 ${LEVEL_BORDER_CLASSES[level]} ${
                    isCurrentMonth ? '' : 'opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium leading-none ${
                        isToday
                          ? 'bg-accent-500 text-white rounded-full w-5 h-5 flex items-center justify-center'
                          : 'text-primary-600 dark:text-cream-300'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    {total > 0 && (
                      <span className="font-mono tabular-nums text-[10px] font-semibold text-primary-500 dark:text-cream-400 truncate ml-1">
                        {formatCurrency(total)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {expenses.slice(0, maxVisible).map((exp) => (
                      <div key={exp.id} className="flex items-center justify-between gap-1 text-[10px] leading-tight">
                        <span className="truncate text-primary-600 dark:text-cream-300">{exp.name}</span>
                        <span className={`font-mono tabular-nums shrink-0 font-medium ${exp.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-primary-700 dark:text-cream-200'}`}>{exp.type === 'income' ? '+' : ''}{formatCurrency(exp.amount)}</span>
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="text-[10px] text-primary-400 dark:text-cream-500">+{overflow} {t('moreItems')}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Weekly View
// ============================================================

function WeeklyView({
  currentDate, formatCurrency, t,
}: {
  currentDate: Date; formatCurrency: (n: number) => string; t: (key: any) => string;
}) {
  const weekStart = getMonday(currentDate);
  const weekEnd = addDays(weekStart, 6);

  const startStr = toDateStr(weekStart);
  const endStr = toDateStr(weekEnd);

  const { data, isLoading, error } = useExpensesByDateRange(startStr, endStr);

  const { expensesByDate, dailyTotals } = useMemo(() => {
    const expMap = new Map<string, ExpenseWithUser[]>();
    const totalsMap = new Map<string, number>();
    if (data?.expenses) {
      for (const exp of data.expenses) {
        const key = exp.purchase_date;
        if (!expMap.has(key)) expMap.set(key, []);
        expMap.get(key)!.push(exp);
        totalsMap.set(key, (totalsMap.get(key) || 0) + exp.amount);
      }
    }
    return { expensesByDate: expMap, dailyTotals: totalsMap };
  }, [data]);

  const { maxAmount, weekTotal } = useMemo(() => {
    let max = 0;
    let sum = 0;
    dailyTotals.forEach((v) => {
      if (v > max) max = v;
      sum += v;
    });
    return { maxAmount: max, weekTotal: sum };
  }, [dailyTotals]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { date: d, dateStr: toDateStr(d) };
  });

  const today = new Date();

  if (isLoading) return LOADING_SPINNER;
  if (error) return <ErrorMessage t={t} />;

  return (
    <div className="space-y-4">
      <div className="text-right text-sm text-primary-500 dark:text-cream-300">
        {t('weekTotal')}: <span className="font-mono tabular-nums font-semibold text-primary-700 dark:text-cream-100">{formatCurrency(weekTotal)}</span>
      </div>

      {/* Mobile: stacked cards */}
      <div className="sm:hidden space-y-3">
        {days.map((day) => {
          const expenses = expensesByDate.get(day.dateStr) || [];
          const total = dailyTotals.get(day.dateStr) || 0;
          const level = getColorLevel(total, maxAmount);
          const isToday = isSameDay(day.date, today);
          const dayIdx = day.date.getDay() === 0 ? 6 : day.date.getDay() - 1;

          return (
            <div key={day.dateStr} className="card p-0 overflow-hidden">
              <div className={`px-3 py-2 flex items-center justify-between ${LEVEL_CLASSES[level]}`}>
                <span className={`text-sm font-medium ${isToday ? 'text-accent-600 dark:text-accent-300' : 'text-primary-700 dark:text-cream-100'}`}>
                  {t(`day.${DAY_KEYS[dayIdx]}`)}{' '}
                  {day.date.getDate()} {t(`monthShort.${MONTH_SHORT_KEYS[day.date.getMonth()]}`)}
                  {isToday && <span className="ml-1.5 text-xs text-accent-500">({t('today')})</span>}
                </span>
                {total > 0 && (
                  <span className="font-mono tabular-nums text-sm font-semibold text-primary-700 dark:text-cream-100">{formatCurrency(total)}</span>
                )}
              </div>
              {expenses.length > 0 ? (
                <div className="divide-y divide-cream-200 dark:divide-primary-700">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="px-3 py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary-700 dark:text-cream-100 truncate">{exp.name}</p>
                        <p className="text-xs text-primary-400 dark:text-cream-500">{exp.category}</p>
                      </div>
                      <span className={`font-mono tabular-nums text-sm font-semibold shrink-0 ${exp.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-primary-700 dark:text-cream-100'}`}>{exp.type === 'income' ? '+' : ''}{formatCurrency(exp.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-3 text-xs text-primary-400 dark:text-cream-500">{t('noExpenses')}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: 7-column grid */}
      <div className="hidden sm:grid grid-cols-7 gap-px card p-0 overflow-hidden">
        {days.map((day) => {
          const expenses = expensesByDate.get(day.dateStr) || [];
          const total = dailyTotals.get(day.dateStr) || 0;
          const level = getColorLevel(total, maxAmount);
          const isToday = isSameDay(day.date, today);
          const dayIdx = day.date.getDay() === 0 ? 6 : day.date.getDay() - 1;

          return (
            <div key={day.dateStr} className="flex flex-col min-h-[300px] border-r last:border-r-0 border-cream-200 dark:border-primary-700">
              <div className={`px-2 py-2 text-center border-b border-cream-200 dark:border-primary-700 ${LEVEL_CLASSES[level]}`}>
                <div className={`text-xs font-medium ${isToday ? 'text-accent-600 dark:text-accent-300' : 'text-primary-500 dark:text-cream-400'}`}>
                  {t(`day.${DAY_KEYS[dayIdx]}`)}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-accent-600 dark:text-accent-300' : 'text-primary-700 dark:text-cream-100'}`}>
                  {day.date.getDate()}
                </div>
                {total > 0 && (
                  <div className="font-mono tabular-nums text-[10px] font-semibold text-primary-600 dark:text-cream-300 mt-0.5">
                    {formatCurrency(total)}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                {expenses.length === 0 && (
                  <p className="text-[10px] text-primary-400 dark:text-cream-500 text-center mt-4">{t('noExpenses')}</p>
                )}
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="rounded p-1.5 bg-cream-100 dark:bg-primary-700/60 border border-cream-200 dark:border-primary-600"
                  >
                    <p className="text-[11px] font-medium text-primary-700 dark:text-cream-100 truncate">{exp.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[9px] text-primary-400 dark:text-cream-500 truncate">{exp.category}</span>
                      <span className={`font-mono tabular-nums text-[10px] font-semibold shrink-0 ml-1 ${exp.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-primary-700 dark:text-cream-100'}`}>{exp.type === 'income' ? '+' : ''}{formatCurrency(exp.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Shared bits
// ============================================================

const LOADING_SPINNER = (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-accent-400" />
  </div>
);

function ErrorMessage({ t }: { t: (key: any) => string }) {
  return (
    <div className="text-center py-12">
      <p className="text-red-600 dark:text-red-400">{t('failedToLoadCalendar')}</p>
    </div>
  );
}

function Legend({ t }: { t: (key: any) => string }) {
  return (
    <div className="flex items-center justify-end gap-2 text-xs text-primary-400 dark:text-cream-400">
      <span>{t('less')}</span>
      {LEVEL_CLASSES.map((cls, i) => (
        <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
      ))}
      <span>{t('more')}</span>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function CalendarHeatmap() {
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const { data: familyData } = useFamily();
  const { t, formatCurrency: formatCurrencyLocale } = useTranslation();

  const currency = familyData?.family.currency || 'USD';
  const formatCurrency = useCallback(
    (amount: number) => formatCurrencyLocale(amount, currency),
    [formatCurrencyLocale, currency],
  );

  // Navigation
  const goToday = () => setCurrentDate(new Date());

  const goPrev = () => {
    setCurrentDate((d) => {
      if (view === 'week') return addDays(getMonday(d), -7);
      if (view === 'month') return new Date(d.getFullYear(), d.getMonth() - 1, 1);
      return new Date(d.getFullYear() - 1, 0, 1);
    });
  };

  const goNext = () => {
    setCurrentDate((d) => {
      if (view === 'week') return addDays(getMonday(d), 7);
      if (view === 'month') return new Date(d.getFullYear(), d.getMonth() + 1, 1);
      return new Date(d.getFullYear() + 1, 0, 1);
    });
  };

  // Period label
  const periodLabel = useMemo(() => {
    if (view === 'year') return String(currentDate.getFullYear());
    if (view === 'month') return `${t(`month.${MONTH_KEYS[currentDate.getMonth()]}`)} ${currentDate.getFullYear()}`;
    const ws = getMonday(currentDate);
    const we = addDays(ws, 6);
    const fmt = (d: Date) => `${t(`monthShort.${MONTH_SHORT_KEYS[d.getMonth()]}`)} ${d.getDate()}`;
    if (ws.getFullYear() !== we.getFullYear()) {
      return `${fmt(ws)}, ${ws.getFullYear()} — ${fmt(we)}, ${we.getFullYear()}`;
    }
    return `${fmt(ws)} — ${fmt(we)}, ${ws.getFullYear()}`;
  }, [view, currentDate, t]);

  const views: { key: ViewMode; label: string }[] = [
    { key: 'week', label: t('week') },
    { key: 'month', label: t('month') },
    { key: 'year', label: t('year') },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* View switcher */}
        <div className="flex rounded-lg border border-cream-300 dark:border-primary-600 overflow-hidden">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === v.key
                  ? 'bg-accent-500 text-white'
                  : 'text-primary-600 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-primary-700'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="btn-secondary px-2.5 py-1.5 text-sm">
            {CHEVRON_LEFT}
          </button>
          <button onClick={goToday} className="btn-secondary px-3 py-1.5 text-xs">
            {t('today')}
          </button>
          <button onClick={goNext} className="btn-secondary px-2.5 py-1.5 text-sm">
            {CHEVRON_RIGHT}
          </button>
          <span className="text-sm sm:text-base font-semibold text-primary-700 dark:text-cream-100 ml-2">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* View body */}
      {view === 'year' && <AnnualView year={currentDate.getFullYear()} formatCurrency={formatCurrency} t={t} />}
      {view === 'month' && <MonthlyView currentDate={currentDate} formatCurrency={formatCurrency} t={t} />}
      {view === 'week' && <WeeklyView currentDate={currentDate} formatCurrency={formatCurrency} t={t} />}
    </div>
  );
}
