import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../lib/api';
import type { CreateFamilyRequest, UpdateFamilyRequest } from '../../../shared/src';

export function useFamily() {
  return useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getCurrent(),
    retry: false,
  });
}

export function useFamilyMembers() {
  return useQuery({
    queryKey: ['family', 'members'],
    queryFn: () => familyApi.getMembers(),
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFamilyRequest) => familyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useUpdateFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFamilyRequest) => familyApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useJoinFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) => familyApi.join(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => familyApi.regenerateCode(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useLeaveFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => familyApi.leave(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}
