// useMutation wrapper around auth.api.logout. Clears cached server data and flow state.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { useOnboardingStore } from '@/store/onboarding.store';
import { logout } from '../api/auth.api';
import type { LogoutResponse } from '../types/auth.types';

export function useLogout() {
  const queryClient = useQueryClient();
  const reset = useOnboardingStore((state) => state.reset);

  return useMutation<LogoutResponse, ApiError, void>({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      reset();
    },
  });
}
