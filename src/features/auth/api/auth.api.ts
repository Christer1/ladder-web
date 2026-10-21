// Auth API functions: signup, verifyOtp, resendOtp, createPin. Calls lib/api/client only.
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { ApiSuccess } from '@/types/api.types';
import type {
  CreatePinRequest,
  CreatePinResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  SignupRequest,
  SignupResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../types/auth.types';

export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  const res = await apiClient.post<ApiSuccess<SignupResponse>>(ENDPOINTS.auth.signup, payload);
  return res.data.data;
}

export async function verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  const res = await apiClient.post<ApiSuccess<VerifyOtpResponse>>(
    ENDPOINTS.auth.verifyOtp,
    payload,
  );
  return res.data.data;
}

export async function resendOtp(payload: ResendOtpRequest): Promise<ResendOtpResponse> {
  const res = await apiClient.post<ApiSuccess<ResendOtpResponse>>(
    ENDPOINTS.auth.resendOtp,
    payload,
  );
  return res.data.data;
}

export async function createPin(payload: CreatePinRequest): Promise<CreatePinResponse> {
  const res = await apiClient.post<ApiSuccess<CreatePinResponse>>(
    ENDPOINTS.auth.createPin,
    payload,
  );
  return res.data.data;
}
