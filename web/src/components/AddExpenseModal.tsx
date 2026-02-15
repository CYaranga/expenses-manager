import { useState, useEffect } from 'react';
import { useCreateExpense, useUpdateExpense, useCategories } from '../hooks/useExpenses';
import { useTranslation } from '../hooks/useTranslation';
import type { ExpenseWithUser, TransactionType } from '../../../shared/src';
import { activityLogger, errorLogger } from '../lib/logger';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: ExpenseWithUser | null;
}

export default function AddExpenseModal({ isOpen, onClose, expense }: AddExpenseModalProps) {
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const { t, tc } = useTranslation();

  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [place, setPlace] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );

  const { data: categoriesData } = useCategories(type);

  useEffect(() => {
    if (expense) {
      setType(expense.type || 'expense');
      setName(expense.name);
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setPlace(expense.place || '');
      setPurchaseDate(expense.purchase_date);
    } else {
      setName('');
      setAmount('');
      setCategory('');
      setPlace('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
    }
  }, [expense, isOpen]);

  // Reset category when type changes (unless editing)
  useEffect(() => {
    if (!expense) {
      setCategory('');
    }
  }, [type, expense]);

  if (!isOpen) return null;

  const isEditing = !!expense;
  const isPending = createExpense.isPending || updateExpense.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      name,
      amount: parseFloat(amount),
      category,
      type,
      place: place || null,
      purchase_date: purchaseDate,
    };

    try {
      if (isEditing) {
        activityLogger.trackExpenseUpdated(expense.id, formData);
        await updateExpense.mutateAsync({
          id: expense.id,
          data: formData,
        });
        activityLogger.trackFormSubmit('EditExpense', true, { expenseId: expense.id });
      } else {
        activityLogger.trackExpenseCreated(formData);
        await createExpense.mutateAsync({
          ...formData,
          place: formData.place || undefined,
        });
        activityLogger.trackFormSubmit('CreateExpense', true);
      }
      activityLogger.trackModalClose(isEditing ? 'EditExpense' : 'AddExpense');
      onClose();
    } catch (err) {
      errorLogger.logError(err, {
        action: isEditing ? 'update-expense' : 'create-expense',
        formData,
      });
      activityLogger.trackFormSubmit(
        isEditing ? 'EditExpense' : 'CreateExpense',
        false,
        { error: err instanceof Error ? err.message : 'Unknown error' }
      );
      alert(err instanceof Error ? err.message : t('failedToSave'));
    }
  };

  const title = isEditing
    ? type === 'income' ? t('editIncomeTitle') : t('editExpenseTitle')
    : type === 'income' ? t('addIncomeTitle') : t('addExpenseTitle');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-primary-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-cream-200 dark:border-primary-700">
          <h2 className="text-lg font-semibold font-display text-primary-700 dark:text-cream-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-cream-200 dark:hover:bg-primary-700"
          >
            <svg className="w-5 h-5 text-primary-500 dark:text-cream-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-lg border border-cream-300 dark:border-primary-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                type === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'text-primary-600 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-primary-700'
              }`}
            >
              {t('expense')}
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                type === 'income'
                  ? 'bg-emerald-600 text-white'
                  : 'text-primary-600 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-primary-700'
              }`}
            >
              {t('income')}
            </button>
          </div>

          <div>
            <label className="label">{t('name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder={type === 'income' ? t('incomeSource') : t('whatDidYouBuy')}
              required
            />
          </div>

          <div>
            <label className="label">{t('amount')}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input font-mono tabular-nums"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          <div>
            <label className="label">{t('category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
              required
            >
              <option value="">{t('selectCategory')}</option>
              {categoriesData?.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {tc(cat)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{t('placeOptional')}</label>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="input"
              placeholder={t('whereQuestion')}
            />
          </div>

          <div>
            <label className="label">{t('date')}</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-accent flex-1"
            >
              {isPending ? t('saving') : isEditing ? t('update') : t('add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
