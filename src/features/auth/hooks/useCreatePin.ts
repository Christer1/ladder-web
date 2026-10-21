// useMutation wrapper around auth.api.createPin.
import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { createPin } from '../api/auth.api';
import type { CreatePinRequest, CreatePinResponse } from '../types/auth.types';

export function useCreatePin() {
  return useMutation<CreatePinResponse, ApiError, CreatePinRequest>({ mutationFn: createPin });
}
