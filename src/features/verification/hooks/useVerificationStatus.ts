// useQuery wrapper around verification.api.getVerificationStatus.
import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { getVerificationStatus } from '../api/verification.api';
import type { VerificationStatus } from '../types/verification.types';

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
