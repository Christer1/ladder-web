// useMutation wrapper around auth.api.logout.
//
// The query cache is deliberately NOT cleared here: clearing it while a protected page is still
// mounted makes that page refetch without a session, show a 401 error and trigger a second
// redirect. The caller leaves with a full page load instead (see ProfileOverview), which drops
// every cached response at once.
import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { useOnboardingStore } from '@/store/onboarding.store';
import { logout } from '../api/auth.api';
import type { LogoutResponse } from '../types/auth.types';

export function useLogout() {
  const reset = useOnboardingStore((state) => state.reset);

  return useMutation<LogoutResponse, ApiError, void>({
    mutationFn: logout,
    // Settled, not success: an already-expired session (401) is signed out too.
    onSettled: () => reset(),
  });
}
