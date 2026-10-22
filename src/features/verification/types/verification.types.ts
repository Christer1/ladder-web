// Request/response types for verification endpoints (ladder-backend modules/verification).

/** Matches the backend's StepStatus (Prisma VerificationStatus + NOT_STARTED). */
export type VerificationStepStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED';

/** Credentials on the /credentials screen, in display order. Date of birth always comes first. */
export type CredentialKind = 'dateOfBirth' | 'bvn' | 'nin' | 'governmentId';

/** Onboarding pages the backend remembers, so sign-in can return the user to the one they left. */
export type OnboardingPageStep = 'CREDENTIALS' | 'UPLOAD_ID' | 'LIVENESS';

export type VerificationStatus = {
  bvn: VerificationStepStatus;
  nin: VerificationStepStatus;
  /** Issued by the first verified BVN or NIN, or at liveness for a Government ID. */
  ladderId: string | null;
  governmentId: VerificationStepStatus;
  liveness: VerificationStepStatus;
  /** The onboarding page the user was last on; null until they open one. */
  lastStep: OnboardingPageStep | null;
};

export type VerificationResultResponse = {
  status: VerificationStepStatus;
  ladderId: string | null;
};

/** Date of birth is not verified on its own: it is sent with each BVN/NIN lookup and must match. */
export type VerifyBvnRequest = {
  bvn: string;
  /** ISO date, YYYY-MM-DD. */
  dateOfBirth: string;
};

export type VerifyNinRequest = {
  nin: string;
  /** ISO date, YYYY-MM-DD. */
  dateOfBirth: string;
};

export type GovernmentIdType =
  'national-id-card' | 'international-passport' | 'drivers-licence' | 'voters-card';

/** Which side of the document an image shows. Passports only have a front (the photo page). */
export type IdSide = 'front' | 'back';

export type UploadGovernmentIdRequest = {
  idType: GovernmentIdType;
  front: File;
  /** Required for card IDs (see GOVERNMENT_ID_OPTIONS[].sides); omitted for passports. */
  back?: File;
};

export type SubmitLivenessRequest = {
  selfie: Blob;
  /** The random on-device challenges the user completed, in order (for the backend's audit trail). */
  challenges: readonly string[];
};

export type SubmitLivenessResponse = VerificationResultResponse;
