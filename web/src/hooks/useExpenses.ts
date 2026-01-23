import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../lib/api';
import type { CreateExpenseRequest, UpdateExpenseRequest, ExpenseFilters } from '../../../shared/src';

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

export function useExpenseSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['expenses', 'summary', startDate, endDate],
    queryFn: () => expenseApi.getSummary(startDate, endDate),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => expenseApi.getCategories(),
    staleTime: Infinity,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
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
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
