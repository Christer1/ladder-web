// Request/response types for auth endpoints.

export type SignupRequest = {
  email: string;
  password: string;
};

export type SignupResponse = {
  /** Seconds until the OTP can be resent / expires. */
  otpExpiresIn: number;
};

export type VerifyOtpRequest = {
  email: string;
  code: string;
};

/** The session is set as an httpOnly cookie; the body carries nothing the client needs. */
export type VerifyOtpResponse = Record<string, never>;

export type ResendOtpRequest = {
  email: string;
};

export type ResendOtpResponse = {
  otpExpiresIn: number;
};

export type CreatePinRequest = {
  pin: string;
  confirmPin: string;
};

export type CreatePinResponse = Record<string, never>;
