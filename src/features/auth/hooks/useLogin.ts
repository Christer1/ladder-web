// useMutation wrapper around auth.api.login (email + password sign-in).
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { login } from '../api/auth.api';
import type { LoginRequest, LoginResponse } from '../types/auth.types';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: login,
    // A new session exists now: anything cached for a previous one is stale.
    onSuccess: () => queryClient.clear(),
  });
}
