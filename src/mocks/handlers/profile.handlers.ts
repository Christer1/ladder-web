// MSW handlers for profile endpoints.
import { delay, http } from 'msw';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { UserProfile, VerifiedItem } from '@/features/profile/types/profile.types';
import { mockDb } from '../db';
import { ok, requireSession, url } from './http';

const ITEM_ORDER: VerifiedItem[] = ['dateOfBirth', 'bvn', 'nin', 'governmentId', 'liveness'];

export const profileHandlers = [
  http.get(url(ENDPOINTS.profile.me), async () => {
    await delay(400);
    const unauthorized = requireSession();
    if (unauthorized) return unauthorized;

    const { email, status } = mockDb.get();
    return ok<UserProfile>({
      email: email ?? '',
      ladderId: status.ladderId,
      verifiedItems: ITEM_ORDER.filter((item) => status[item] === 'verified'),
    });
  }),
];
