// ApiSuccess<T>, ApiErrorBody, ApiResponse<T> envelope types.
export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  /** Safe to show to the user. */
  message: string;
  /** Machine-readable, e.g. 'OTP_INVALID'. */
  code: string;
  /** Field-level validation errors. */
  errors?: Record<string, string[]>;
};


export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;
