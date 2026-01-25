import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useCreateExpense,
  useUpdateExpense,
  useExpense,
  useCategories,
} from '../hooks/useExpenses';

export default function AddExpensePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: expenseData, isLoading: expenseLoading } = useExpense(id || '');
  const { data: categoriesData } = useCategories();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    place: '',
    purchase_date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && expenseData?.expense) {
      const exp = expenseData.expense;
      setFormData({
        name: exp.name,
        amount: exp.amount.toString(),
        category: exp.category,
        place: exp.place || '',
        purchase_date: exp.purchase_date,
      });
    }
  }, [isEditing, expenseData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      if (isEditing) {
        await updateExpense.mutateAsync({
          id: id!,
          data: {
            name: formData.name,
            amount,
            category: formData.category,
            place: formData.place || undefined,
            purchase_date: formData.purchase_date,
          },
        });
      } else {
        await createExpense.mutateAsync({
          name: formData.name,
          amount,
          category: formData.category,
          place: formData.place || undefined,
          purchase_date: formData.purchase_date,
        });
      }
      navigate('/expenses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isEditing && expenseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button for mobile */}
      <button
        onClick={() => navigate('/expenses')}
        className="sm:hidden flex items-center text-gray-600 mb-4 -ml-1"
      >
        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        {isEditing ? 'Edit Expense' : 'Add New Expense'}
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-4 sm:space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="name" className="label">
            Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="input"
            placeholder="e.g., Weekly groceries"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="label">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                id="amount"
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={handleChange}
                className="input pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="purchase_date" className="label">
              Date *
            </label>
            <input
              id="purchase_date"
              name="purchase_date"
              type="date"
              required
              value={formData.purchase_date}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="label">
            Category *
          </label>
          <select
            id="category"
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className="input"
          >
            <option value="">Select a category</option>
            {categoriesData?.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="place" className="label">
            Place (optional)
          </label>
          <input
            id="place"
            name="place"
            type="text"
            value={formData.place}
            onChange={handleChange}
            className="input"
            placeholder="e.g., Walmart, Amazon"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 sm:pt-4">
          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createExpense.isPending || updateExpense.isPending}
            className="btn-primary flex-1"
          >
            {createExpense.isPending || updateExpense.isPending
              ? 'Saving...'
              : isEditing
                ? 'Update Expense'
                : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  );
}
