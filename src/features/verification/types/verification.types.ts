// Request/response types for verification endpoints.

export type VerificationStepStatus = 'not_started' | 'pending' | 'verified' | 'failed';

/** Credentials on the /credentials screen, in display order. Date of birth always comes first. */
export type CredentialKind = 'dateOfBirth' | 'bvn' | 'nin' | 'governmentId';

export type VerificationStatus = {
  dateOfBirth: VerificationStepStatus;
  bvn: VerificationStepStatus;
  nin: VerificationStepStatus;
  governmentId: VerificationStepStatus;
  liveness: VerificationStepStatus;
  ladderId: string | null;
};

export type VerifyCredentialResponse = {
  status: VerificationStepStatus;
};

export type VerifyDateOfBirthRequest = {
  /** ISO date, YYYY-MM-DD. */
  dateOfBirth: string;
};

export type VerifyBvnRequest = {
  bvn: string;
};

export type VerifyNinRequest = {
  nin: string;
};

export type GovernmentIdType =
  'national-id-card' | 'international-passport' | 'drivers-licence' | 'voters-card';

export type UploadGovernmentIdRequest = {
  idType: GovernmentIdType;
  file: File;
};

export type SubmitLivenessRequest = {
  selfie: Blob;
  /** The random on-device challenges the user completed, in order (for the backend's audit trail). */
  challenges: readonly string[];
};

export type SubmitLivenessResponse = {
  status: VerificationStepStatus;
  ladderId: string | null;
};
