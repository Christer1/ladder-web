// Verification API functions: verifyDateOfBirth, verifyBvn, verifyNin, uploadGovernmentId, submitLiveness, getVerificationStatus.
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { ApiSuccess } from '@/types/api.types';
import type {
  SubmitLivenessRequest,
  SubmitLivenessResponse,
  UploadGovernmentIdRequest,
  VerificationStatus,
  VerifyBvnRequest,
  VerifyCredentialResponse,
  VerifyDateOfBirthRequest,
  VerifyNinRequest,
} from '../types/verification.types';

/** BVN/NIN lookups can be slow on the provider side. */
const LOOKUP_TIMEOUT_MS = 60_000;

export async function getVerificationStatus(): Promise<VerificationStatus> {
  const res = await apiClient.get<ApiSuccess<VerificationStatus>>(ENDPOINTS.verification.status);
  return res.data.data;
}

export async function verifyDateOfBirth(
  payload: VerifyDateOfBirthRequest,
): Promise<VerifyCredentialResponse> {
  const res = await apiClient.post<ApiSuccess<VerifyCredentialResponse>>(
    ENDPOINTS.verification.dateOfBirth,
    payload,
  );
  return res.data.data;
}

export async function verifyBvn(payload: VerifyBvnRequest): Promise<VerifyCredentialResponse> {
  const res = await apiClient.post<ApiSuccess<VerifyCredentialResponse>>(
    ENDPOINTS.verification.bvn,
    payload,
    { timeout: LOOKUP_TIMEOUT_MS },
  );
  return res.data.data;
}

export async function verifyNin(payload: VerifyNinRequest): Promise<VerifyCredentialResponse> {
  const res = await apiClient.post<ApiSuccess<VerifyCredentialResponse>>(
    ENDPOINTS.verification.nin,
    payload,
    { timeout: LOOKUP_TIMEOUT_MS },
  );
  return res.data.data;
}

export async function uploadGovernmentId(
  { idType, file }: UploadGovernmentIdRequest,
  onProgress?: (percent: number) => void,
): Promise<VerifyCredentialResponse> {
  const body = new FormData();
  body.append('idType', idType);
  body.append('file', file);

  // No Content-Type header: Axios sets the multipart boundary itself (rules.md §8.7).
  const res = await apiClient.post<ApiSuccess<VerifyCredentialResponse>>(
    ENDPOINTS.verification.governmentId,
    body,
    {
      timeout: 120_000,
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    },
  );
  return res.data.data;
}

export async function submitLiveness({
  selfie,
  challenges,
}: SubmitLivenessRequest): Promise<SubmitLivenessResponse> {
  const body = new FormData();
  body.append('selfie', selfie, 'selfie.jpg');
  body.append('challenges', JSON.stringify(challenges));

  const res = await apiClient.post<ApiSuccess<SubmitLivenessResponse>>(
    ENDPOINTS.verification.liveness,
    body,
    { timeout: 120_000 },
  );
  return res.data.data;
}
