// User profile types (includes ladderId, verification status).

export type VerifiedItem = 'dateOfBirth' | 'bvn' | 'nin' | 'governmentId' | 'liveness';

export type UserProfile = {
  email: string;
  ladderId: string | null;
  /** Credentials that are verified, in the order they were shown during onboarding. */
  verifiedItems: VerifiedItem[];
};
