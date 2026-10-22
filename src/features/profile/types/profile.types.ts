// User profile types (GET /profile/me, ladder-backend modules/users).
import type { VerificationStepStatus } from '@/features/verification';

export type UserStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED';

export type VerificationType = 'BVN' | 'NIN' | 'GOVERNMENT_ID' | 'LIVENESS';

export type VerificationSummary = {
  type: VerificationType;
  status: Exclude<VerificationStepStatus, 'NOT_STARTED'>;
  /** e.g. "*******8901"; the full number is never returned. */
  maskedValue: string | null;
  /** ISO 8601. */
  verifiedAt: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  /** YYYY-MM-DD, set once a BVN or NIN is verified. */
  dateOfBirth: string | null;
  ladderId: string | null;
  status: UserStatus;
  verifications: VerificationSummary[];
};
