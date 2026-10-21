// The ONLY Axios instance. baseURL from config/env, withCredentials, auth + error interceptors.
import axios from 'axios';
import { env } from '@/config/env';
import { ROUTES } from '@/config/routes';
import { isMockingEnabled, startMocks } from '@/mocks/start';
import { useOnboardingStore } from '@/store/onboarding.store';
import { ENDPOINTS } from './endpoints';
import { normalizeError } from './errors';

const AUTH_PATHS: readonly string[] = Object.values(ENDPOINTS.auth);

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  // Session is an httpOnly cookie set on OTP verify (rules.md §8.6).
  withCredentials: true,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
});

// Development only: hold requests until the MSW worker is ready (no-op otherwise).
apiClient.interceptors.request.use(async (config) => {
  if (isMockingEnabled) await startMocks();
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeError(error);
    const requestPath = axios.isAxiosError(error) ? error.config?.url : undefined;

    // Expired session on a protected call: start over. Auth endpoints report their own 401s.
    if (apiError.status === 401 && requestPath && !AUTH_PATHS.includes(requestPath)) {
      useOnboardingStore.getState().reset();
      if (typeof window !== 'undefined') window.location.assign(ROUTES.SIGNUP);
    }

    return Promise.reject(apiError);
  },
);
