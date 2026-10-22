// useMutation wrapper around verification.api.uploadGovernmentId (multipart, upload progress).
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { uploadGovernmentId } from '../api/verification.api';
import type {
  UploadGovernmentIdRequest,
  VerificationResultResponse,
} from '../types/verification.types';
import { verificationQueryKeys } from './useVerificationStatus';

export function useUploadGovernmentId() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation<VerificationResultResponse, ApiError, UploadGovernmentIdRequest>({
    mutationFn: (payload) => {
      setProgress(0);
      return uploadGovernmentId(payload, setProgress);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: verificationQueryKeys.status }),
  });

  return { ...mutation, progress };
}
