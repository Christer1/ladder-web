// GET /profile/me is served by ladder-backend; only the mocked Ladder ID fallback is added.
import { http } from 'msw';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { UserProfile } from '@/features/profile/types/profile.types';
import { mockDb } from '../db';
import { passthroughAndExtend, url } from './http';

export const profileHandlers = [
  http.get(url(ENDPOINTS.profile.me), ({ request }) =>
    passthroughAndExtend<UserProfile>(request, (profile) => ({
      ...profile,
      ladderId: profile.ladderId ?? mockDb.get().ladderId,
    })),
  ),
];
