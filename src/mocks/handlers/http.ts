// Envelope helpers shared by the MSW handlers (same shapes as rules.md §8.3).
import { bypass, HttpResponse } from 'msw';
import { env } from '@/config/env';
import type { ApiErrorBody, ApiResponse, ApiSuccess } from '@/types/api.types';

export const url = (path: string) => `${env.apiBaseUrl}${path}`;

// Typed as plain Response so one handler can return either helper.
export const ok = <T>(data: T, message = 'OK'): Response =>
  HttpResponse.json<ApiSuccess<T>>({ success: true, message, data });

export const fail = (status: number, body: Omit<ApiErrorBody, 'success'>): Response =>
  HttpResponse.json<ApiErrorBody>({ success: false, ...body }, { status });

/**
 * Sends the request on to ladder-backend (with the session cookie) and lets `extend` add the
 * mocked fields to a successful response. Errors (401 included) are returned unchanged.
 */
export async function passthroughAndExtend<T>(
  request: Request,
  extend: (data: T) => T,
): Promise<Response> {
  const response = await fetch(bypass(request));
  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success) return HttpResponse.json(body, { status: response.status });
  return HttpResponse.json<ApiSuccess<T>>(
    { ...body, data: extend(body.data) },
    { status: response.status },
  );
}
