// Pure helpers that turn a VerificationStatus into "what can the user do next".
// Shared by the credentials screen, the Continue button and RouteGuard.
import { ROUTES, type Route } from '@/config/routes';
import type { VerificationStatus } from '../types/verification.types';

/** Date of birth is verified first; BVN/NIN lookups are matched against it. */
export function isDateOfBirthVerified(status: VerificationStatus): boolean {
  return status.dateOfBirth === 'verified';
}

/**
 * One identity credential is enough to continue (matches the design, rules.md §2 open question 1).
 * A Government ID may still be under manual review ('pending') and still counts.
 */
export function hasIdentityCredential(status: VerificationStatus): boolean {
  return (
    status.bvn === 'verified' ||
    status.nin === 'verified' ||
    status.governmentId === 'verified' ||
    status.governmentId === 'pending'
  );
}

export function canLeaveCredentials(status: VerificationStatus): boolean {
  return isDateOfBirthVerified(status) && hasIdentityCredential(status);
}

export function isFullyVerified(status: VerificationStatus): boolean {
  return status.liveness === 'verified' && Boolean(status.ladderId);
}

/** The first step the user still has to complete. */
export function getNextVerificationRoute(status: VerificationStatus): Route {
  if (!canLeaveCredentials(status)) return ROUTES.CREDENTIALS;
  if (!isFullyVerified(status)) return ROUTES.LIVENESS;
  return ROUTES.VERIFIED;
}

/** Whether `pathname` may be shown now. Earlier steps stay reachable so users can go back. */
export function isRouteAllowed(pathname: string, status: VerificationStatus): boolean {
  switch (pathname) {
    case ROUTES.CREDENTIALS:
      return true;
    case ROUTES.UPLOAD_ID:
      return isDateOfBirthVerified(status);
    case ROUTES.LIVENESS:
      return canLeaveCredentials(status);
    case ROUTES.VERIFIED:
    case ROUTES.PROFILE:
      return isFullyVerified(status);
    default:
      return true;
  }
}
