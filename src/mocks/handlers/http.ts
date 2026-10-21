// Envelope helpers shared by the MSW handlers (same shapes as rules.md §8.3).
import { HttpResponse } from 'msw';
import { env } from '@/config/env';
import type { ApiErrorBody, ApiSuccess } from '@/types/api.types';
import { mockDb } from '../db';

export const url = (path: string) => `${env.apiBaseUrl}${path}`;

// Typed as plain Response so one handler can return either helper.
export const ok = <T>(data: T, message = 'OK'): Response =>
  HttpResponse.json<ApiSuccess<T>>({ success: true, message, data });

export const fail = (status: number, body: Omit<ApiErrorBody, 'success'>): Response =>
  HttpResponse.json<ApiErrorBody>({ success: false, ...body }, { status });

/** Returns a 401 response when there is no session, otherwise null. */
export function requireSession(): Response | null {
  if (mockDb.get().hasSession) return null;
  return fail(401, {
    message: 'Your session has expired. Please start again.',
    code: 'UNAUTHORIZED',
  });
}
