// Redirects to /login when there is no session; to the next pending step otherwise.
//
// No session: GET /verification/status answers 401 and lib/api/client redirects to /login.
// Session but page not allowed: replace() to getResumeRoute (profile for users with a Ladder ID,
// otherwise the page they were last on or the first step left).
// Users without a Ladder ID: the onboarding page they open is saved on the backend, so signing
// back in (on any device) returns them to it.
// Children always stay mounted (hidden until allowed) so Next.js can still prerender and
// validate the segment for instant navigation.
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Spinner } from '@/components/ui';
import {
  getOnboardingStep,
  getResumeRoute,
  isRouteAllowed,
  useSaveLastStep,
  useVerificationStatus,
} from '@/features/verification';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: status, isError, error, refetch, isRefetching } = useVerificationStatus();
  const isAllowed = status ? isRouteAllowed(pathname, status) : false;
  const { mutate: saveLastStep } = useSaveLastStep();

  useEffect(() => {
    if (status && !isAllowed) router.replace(getResumeRoute(status));
  }, [status, isAllowed, router]);

  // Remember where an unfinished user is. Users with a Ladder ID always resume on their profile.
  const step = getOnboardingStep(pathname);
  const shouldSaveStep = Boolean(
    status && isAllowed && step && !status.ladderId && status.lastStep !== step,
  );
  useEffect(() => {
    if (shouldSaveStep && step) saveLastStep(step);
  }, [shouldSaveStep, step, saveLastStep]);

  // A 401 is already being redirected by the API client.
  const hasBlockingError = isError && error.status !== 401;

  return (
    <>
      {!isAllowed && (
        <div className="flex min-h-dvh items-center justify-center bg-surface px-7">
          {hasBlockingError ? (
            <div className="flex max-w-sm flex-col items-center gap-4 text-center" role="alert">
              <p className="text-[15px] text-text-body">{error.message}</p>
              <Button
                variant="secondary"
                onClick={() => void refetch()}
                isLoading={isRefetching}
                className="w-auto"
              >
                Try again
              </Button>
            </div>
          ) : (
            <Spinner label="Loading your progress" className="text-brand-500" />
          )}
        </div>
      )}
      <div hidden={!isAllowed}>{children}</div>
    </>
  );
}
