// useMutation wrapper around auth.api.signup.
import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { signup } from '../api/auth.api';
import type { SignupRequest, SignupResponse } from '../types/auth.types';

export function useSignup() {
  return useMutation<SignupResponse, ApiError, SignupRequest>({ mutationFn: signup });
}
