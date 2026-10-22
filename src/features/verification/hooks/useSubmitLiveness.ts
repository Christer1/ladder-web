// useMutation wrapper around verification.api.submitLiveness.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { submitLiveness } from '../api/verification.api';
import type { SubmitLivenessRequest, SubmitLivenessResponse } from '../types/verification.types';
import { applyVerificationResult } from './useVerificationStatus';

export function useSubmitLiveness() {
  const queryClient = useQueryClient();

  return useMutation<SubmitLivenessResponse, ApiError, SubmitLivenessRequest>({
    mutationFn: submitLiveness,
    onSuccess: (result) => applyVerificationResult(queryClient, 'liveness', result),
  });
}
