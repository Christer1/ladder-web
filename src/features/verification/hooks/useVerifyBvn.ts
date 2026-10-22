// useMutation wrapper around verification.api.verifyBvn.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { verifyBvn } from '../api/verification.api';
import type { VerifyBvnRequest, VerificationResultResponse } from '../types/verification.types';
import { applyVerificationResult } from './useVerificationStatus';

export function useVerifyBvn() {
  const queryClient = useQueryClient();

  return useMutation<VerificationResultResponse, ApiError, VerifyBvnRequest>({
    mutationFn: verifyBvn,
    onSuccess: (result) => applyVerificationResult(queryClient, 'bvn', result),
  });
}
