// useMutation wrapper around auth.api.verifyOtp.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { verifyOtp } from '../api/auth.api';
import type { VerifyOtpRequest, VerifyOtpResponse } from '../types/auth.types';

export function useVerifyOtp() {
  const queryClient = useQueryClient();

  return useMutation<VerifyOtpResponse, ApiError, VerifyOtpRequest>({
    mutationFn: verifyOtp,
    // A new session exists now: anything cached for a previous one is stale.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
