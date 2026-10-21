// useMutation wrapper around verification.api.verifyDateOfBirth.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { verifyDateOfBirth } from '../api/verification.api';
import type {
  VerifyDateOfBirthRequest,
  VerifyCredentialResponse,
} from '../types/verification.types';
import { verificationQueryKeys } from './useVerificationStatus';

export function useVerifyDateOfBirth() {
  const queryClient = useQueryClient();

  return useMutation<VerifyCredentialResponse, ApiError, VerifyDateOfBirthRequest>({
    mutationFn: verifyDateOfBirth,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: verificationQueryKeys.status }),
  });
}
