// ApiError class + normalizeError(): turns any Axios/network error into ApiError.
import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '@/types/api.types';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
export const NETWORK_ERROR_MESSAGE =
  'We couldn’t reach Ladder. Check your connection and try again.';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly fieldErrors: Record<string, string[]>;

  constructor({
    message,
    code,
    status,
    fieldErrors = {},
  }: {
    message: string;
    code: string;
    status: number | null;
    fieldErrors?: Record<string, string[]>;
  }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as ApiErrorBody).success === false &&
    typeof (value as ApiErrorBody).message === 'string'
  );
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    // No response: offline, DNS, CORS or timeout.
    if (!error.response) {
      return new ApiError({ message: NETWORK_ERROR_MESSAGE, code: 'NETWORK_ERROR', status: null });
    }

    const { status, data } = error.response;
    if (isApiErrorBody(data)) {
      return new ApiError({
        message: data.message,
        code: data.code,
        status,
        fieldErrors: data.errors,
      });
    }
    return new ApiError({ message: GENERIC_ERROR_MESSAGE, code: 'UNKNOWN', status });
  }

  return new ApiError({ message: GENERIC_ERROR_MESSAGE, code: 'UNKNOWN', status: null });
}
