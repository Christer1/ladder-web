// Every backend URL, grouped by feature. No URL strings anywhere else.
// These paths are a proposal (rules.md §8.2): confirm with ladder-backend.
export const ENDPOINTS = {
  auth: {
    signup: '/auth/signup',
    verifyOtp: '/auth/otp/verify',
    resendOtp: '/auth/otp/resend',
    createPin: '/auth/pin',
  },
  verification: {
    dateOfBirth: '/verification/date-of-birth',
    bvn: '/verification/bvn',
    nin: '/verification/nin',
    governmentId: '/verification/government-id',
    liveness: '/verification/liveness',
    status: '/verification/status',
  },
  profile: {
    me: '/profile/me',
  },
} as const;
