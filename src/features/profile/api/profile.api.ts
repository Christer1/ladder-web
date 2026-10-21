// Profile API functions: getMe.
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { ApiSuccess } from '@/types/api.types';
import type { UserProfile } from '../types/profile.types';

export async function getMe(): Promise<UserProfile> {
  const res = await apiClient.get<ApiSuccess<UserProfile>>(ENDPOINTS.profile.me);
  return res.data.data;
}
