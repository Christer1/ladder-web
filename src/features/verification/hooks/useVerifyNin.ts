// useMutation wrapper around verification.api.verifyNin.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { verifyNin } from '../api/verification.api';
import type { VerifyNinRequest, VerifyCredentialResponse } from '../types/verification.types';
import { verificationQueryKeys } from './useVerificationStatus';

export function useVerifyNin() {
  const queryClient = useQueryClient();

  return useMutation<VerifyCredentialResponse, ApiError, VerifyNinRequest>({
    mutationFn: verifyNin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: verificationQueryKeys.status }),
  });
}
