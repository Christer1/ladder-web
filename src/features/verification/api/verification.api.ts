// Verification API functions: verifyBvn, verifyNin, getVerificationStatus (ladder-backend), and
// uploadGovernmentId, submitLiveness (mock only until the backend serves them).
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { ApiSuccess } from '@/types/api.types';
import type {
  SubmitLivenessRequest,
  SubmitLivenessResponse,
  UploadGovernmentIdRequest,
  VerificationStatus,
  VerificationResultResponse,
  VerifyBvnRequest,
  VerifyNinRequest,
} from '../types/verification.types';

/** BVN/NIN lookups can be slow on the provider side. */
const LOOKUP_TIMEOUT_MS = 60_000;

export async function getVerificationStatus(): Promise<VerificationStatus> {
  const res = await apiClient.get<ApiSuccess<VerificationStatus>>(ENDPOINTS.verification.status);
  return res.data.data;
}

export async function verifyBvn(payload: VerifyBvnRequest): Promise<VerificationResultResponse> {
  const res = await apiClient.post<ApiSuccess<VerificationResultResponse>>(
    ENDPOINTS.verification.bvn,
    payload,
    { timeout: LOOKUP_TIMEOUT_MS },
  );
  return res.data.data;
}

export async function verifyNin(payload: VerifyNinRequest): Promise<VerificationResultResponse> {
  const res = await apiClient.post<ApiSuccess<VerificationResultResponse>>(
    ENDPOINTS.verification.nin,
    payload,
    { timeout: LOOKUP_TIMEOUT_MS },
  );
  return res.data.data;
}

export async function uploadGovernmentId(
  { idType, front, back }: UploadGovernmentIdRequest,
  onProgress?: (percent: number) => void,
): Promise<VerificationResultResponse> {
  const body = new FormData();
  body.append('idType', idType);
  body.append('front', front);
  if (back) body.append('back', back);

  // No Content-Type header: Axios sets the multipart boundary itself (rules.md §8.7).
  const res = await apiClient.post<ApiSuccess<VerificationResultResponse>>(
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
