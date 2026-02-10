import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../lib/api';
import type { CreateExpenseRequest, UpdateExpenseRequest, ExpenseFilters, TransactionType } from '../../../shared/src';

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expenseApi.list(filters),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => expenseApi.get(id),
    enabled: !!id,
  });
}

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: () => expenseApi.getCategories(type),
    staleTime: Infinity,
  });
}

export function useDailyTotals(year: number) {
  return useQuery({
    queryKey: ['daily-totals', year],
    queryFn: () => expenseApi.getDailyTotals(year),
  });
}

export function useSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['summary', startDate, endDate],
    queryFn: () => expenseApi.getSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['daily-totals'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseRequest }) =>
      expenseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['daily-totals'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useExpensesByDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['expenses', 'date-range', startDate, endDate],
    queryFn: () => expenseApi.list({ start_date: startDate, end_date: endDate, limit: 500 }),
    enabled: !!startDate && !!endDate,
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['daily-totals'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}
