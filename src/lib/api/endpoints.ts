// Every backend URL, grouped by feature. No URL strings anywhere else.
// Matches ladder-backend (AIUsage.md §5).
export const ENDPOINTS = {
  auth: {
    signup: '/auth/signup',
    verifyOtp: '/auth/otp/verify',
    resendOtp: '/auth/otp/resend',
    login: '/auth/login',
    logout: '/auth/logout',
  },
  verification: {
    bvn: '/verification/bvn',
    nin: '/verification/nin',
    status: '/verification/status',
    lastStep: '/verification/last-step',
    governmentId: '/verification/government-id',
    liveness: '/verification/liveness',
  },
  profile: {
    me: '/profile/me',
  },
} as const;
