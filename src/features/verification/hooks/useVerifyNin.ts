// useMutation wrapper around verification.api.verifyNin.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { verifyNin } from '../api/verification.api';
import type { VerifyNinRequest, VerificationResultResponse } from '../types/verification.types';
import { applyVerificationResult } from './useVerificationStatus';

export function useVerifyNin() {
  const queryClient = useQueryClient();

  return useMutation<VerificationResultResponse, ApiError, VerifyNinRequest>({
    mutationFn: verifyNin,
    onSuccess: (result) => applyVerificationResult(queryClient, 'nin', result),
  });
}
