// useQuery wrapper around verification.api.getVerificationStatus.
import { useQuery, type QueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { getVerificationStatus } from '../api/verification.api';
import type { VerificationResultResponse, VerificationStatus } from '../types/verification.types';

export const verificationQueryKeys = {
  all: ['verification'] as const,
  status: ['verification', 'status'] as const,
};

export function useVerificationStatus() {
  return useQuery<VerificationStatus, ApiError>({
    queryKey: verificationQueryKeys.status,
    queryFn: getVerificationStatus,
  });
}

type VerificationStep = 'bvn' | 'nin' | 'governmentId' | 'liveness';

/**
 * Applies a verify/upload/liveness result to the cached status, so the screen updates straight
 * away instead of waiting for GET /verification/status again (each backend call costs several
 * database round trips). Falls back to a refetch if no status is cached yet.
 */
export function applyVerificationResult(
  queryClient: QueryClient,
  step: VerificationStep,
  result: VerificationResultResponse,
): Promise<void> | void {
  if (!queryClient.getQueryData(verificationQueryKeys.status)) {
    return queryClient.invalidateQueries({ queryKey: verificationQueryKeys.status });
  }
  queryClient.setQueryData<VerificationStatus>(verificationQueryKeys.status, (status) =>
    status
      ? { ...status, [step]: result.status, ladderId: result.ladderId ?? status.ladderId }
      : status,
  );
}
