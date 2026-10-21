// useMutation wrapper around verification.api.verifyBvn.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { verifyBvn } from '../api/verification.api';
import type { VerifyBvnRequest, VerifyCredentialResponse } from '../types/verification.types';
import { verificationQueryKeys } from './useVerificationStatus';

export function useVerifyBvn() {
  const queryClient = useQueryClient();

  return useMutation<VerifyCredentialResponse, ApiError, VerifyBvnRequest>({
    mutationFn: verifyBvn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: verificationQueryKeys.status }),
  });
}
