// useMutation wrapper around verification.api.saveLastStep. Updates the cached status so the same
// step is not saved again on every render.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { saveLastStep } from '../api/verification.api';
import type { OnboardingPageStep, VerificationStatus } from '../types/verification.types';
import { verificationQueryKeys } from './useVerificationStatus';

export function useSaveLastStep() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, OnboardingPageStep>({
    mutationFn: saveLastStep,
    onSuccess: (_data, step) =>
      queryClient.setQueryData<VerificationStatus>(verificationQueryKeys.status, (status) =>
        status ? { ...status, lastStep: step } : status,
      ),
  });
}
