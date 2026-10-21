// Starts the MSW worker once (StrictMode runs effects twice) when mocks are enabled.
import { env } from '@/config/env';

export const isMockingEnabled =
  process.env.NODE_ENV === 'development' && env.useMocks && typeof window !== 'undefined';

let startPromise: Promise<void> | null = null;

/** Resolves when mocks are ready, or immediately when mocking is off. Never rejects. */
export function startMocks(): Promise<void> {
  if (!isMockingEnabled) return Promise.resolve();
  startPromise ??= import('./browser')
    .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass', quiet: true }))
    .then(() => undefined)
    .catch(() => undefined);
  return startPromise;
}
