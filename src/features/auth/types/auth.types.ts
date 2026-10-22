// Request/response types for auth endpoints (ladder-backend modules/auth).

export type SignupRequest = {
  email: string;
  password: string;
};

/** Returned by signup and resend. */
export type OtpSentResponse = {
  /** Seconds until the code expires. */
  otpExpiresIn: number;
  /** Seconds until a new code can be requested (the 00:45 timer). */
  resendAvailableIn: number;
};

export type SignupResponse = OtpSentResponse;

export type VerifyOtpRequest = {
  email: string;
  code: string;
};

/** The session is set as an httpOnly cookie; the body carries nothing the client needs. */
export type VerifyOtpResponse = Record<string, never>;

export type ResendOtpRequest = {
  email: string;
};

export type ResendOtpResponse = OtpSentResponse;

export type LoginRequest = {
  email: string;
  password: string;
};

/** Sets the session cookie, like OTP verify. */
export type LoginResponse = Record<string, never>;

export type CreatePinRequest = {
  pin: string;
  confirmPin: string;
};

export type CreatePinResponse = Record<string, never>;

/** Clears the session cookie. */
export type LogoutResponse = Record<string, never>;
