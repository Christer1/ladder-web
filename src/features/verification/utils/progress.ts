// Pure helpers that turn a VerificationStatus into "where should the user be".
// Shared by the credentials screen, the Continue button, RouteGuard and sign-in (resume).
import { ROUTES, type Route } from '@/config/routes';
import type { OnboardingPageStep, VerificationStatus } from '../types/verification.types';

/** The onboarding pages whose visit is remembered by the backend (PUT /verification/last-step). */
const STEP_ROUTES: Record<OnboardingPageStep, Route> = {
  CREDENTIALS: ROUTES.CREDENTIALS,
  UPLOAD_ID: ROUTES.UPLOAD_ID,
  LIVENESS: ROUTES.LIVENESS,
};

/** The backend saves the date of birth with the first verified BVN or NIN. */
export function hasVerifiedIdNumber(status: VerificationStatus): boolean {
  return status.bvn === 'VERIFIED' || status.nin === 'VERIFIED';
}

/**
 * One identity credential is enough to continue (matches the design, rules.md §2 open question 1).
 * A Government ID may still be under manual review ('PENDING') and still counts.
 */
export function hasIdentityCredential(status: VerificationStatus): boolean {
  return (
    hasVerifiedIdNumber(status) ||
    status.governmentId === 'VERIFIED' ||
    status.governmentId === 'PENDING'
  );
}

export function canLeaveCredentials(status: VerificationStatus): boolean {
  return hasIdentityCredential(status);
}

/**
 * A Ladder ID means verification is complete: it is issued by the first verified BVN/NIN, or by
 * liveness for a Government ID. These users always belong on their profile.
 */
export function hasLadderId(status: VerificationStatus): boolean {
  return Boolean(status.ladderId);
}

/** The onboarding step a page belongs to, or null for pages that are not remembered. */
export function getOnboardingStep(pathname: string): OnboardingPageStep | null {
  const entry = Object.entries(STEP_ROUTES).find(([, route]) => route === pathname);
  return entry ? (entry[0] as OnboardingPageStep) : null;
}

/** The first step the user still has to do, in order (used by Continue buttons and as a fallback). */
export function getNextVerificationRoute(status: VerificationStatus): Route {
  if (!canLeaveCredentials(status)) return ROUTES.CREDENTIALS;
  if (status.liveness !== 'VERIFIED' || !hasLadderId(status)) return ROUTES.LIVENESS;
  return ROUTES.VERIFIED;
}

/**
 * Where a signed-in user should land (after sign-in, or when a page is not allowed yet):
 *   has a Ladder ID                     → /profile
 *   otherwise, the page they were on    → that page, if they may still be there
 *   otherwise                           → the first step they still have to do
 */
export function getResumeRoute(status: VerificationStatus): Route {
  if (hasLadderId(status)) return ROUTES.PROFILE;
  const lastRoute = status.lastStep ? STEP_ROUTES[status.lastStep] : null;
  if (lastRoute && isRouteAllowed(lastRoute, status)) return lastRoute;
  return getNextVerificationRoute(status);
}

/** Whether `pathname` may be shown now. Earlier steps stay reachable so users can go back. */
export function isRouteAllowed(pathname: string, status: VerificationStatus): boolean {
  switch (pathname) {
    case ROUTES.CREDENTIALS:
    case ROUTES.UPLOAD_ID:
      return true;
    case ROUTES.LIVENESS:
      return canLeaveCredentials(status);
    case ROUTES.VERIFIED:
    case ROUTES.PROFILE:
      return hasLadderId(status);
    default:
      return true;
  }
}
