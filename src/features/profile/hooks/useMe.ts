// useQuery wrapper around profile.api.getMe.
import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { getMe } from '../api/profile.api';
import type { UserProfile } from '../types/profile.types';

export const profileQueryKeys = {
  me: ['profile', 'me'] as const,
};

export function useMe() {
  return useQuery<UserProfile, ApiError>({ queryKey: profileQueryKeys.me, queryFn: getMe });
}
