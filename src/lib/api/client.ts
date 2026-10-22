// The ONLY Axios instance. baseURL from config/env, withCredentials, auth + error interceptors.
import axios from 'axios';
import { env } from '@/config/env';
import { ROUTES } from '@/config/routes';
import { isMockingEnabled, startMocks } from '@/mocks/start';
import { useOnboardingStore } from '@/store/onboarding.store';
import { ENDPOINTS } from './endpoints';
import { normalizeError } from './errors';

// Public endpoints answer 401 for wrong credentials, not for an expired session.
const PUBLIC_AUTH_PATHS: readonly string[] = [
  ENDPOINTS.auth.signup,
  ENDPOINTS.auth.verifyOtp,
  ENDPOINTS.auth.resendOtp,
  ENDPOINTS.auth.login,
  // Sign-out handles its own 401 (an already-expired session still ends on /login).
  ENDPOINTS.auth.logout,
];

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

    // Expired session on a protected call: sign in again, then the login screen resumes onboarding. Public auth endpoints report their own 401s.
    if (apiError.status === 401 && requestPath && !PUBLIC_AUTH_PATHS.includes(requestPath)) {
      useOnboardingStore.getState().reset();
      if (typeof window !== 'undefined' && window.location.pathname !== ROUTES.LOGIN) {
        window.location.assign(ROUTES.LOGIN);
      }
    }

    return Promise.reject(apiError);
  },
);
