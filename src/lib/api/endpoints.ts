// Every backend URL, grouped by feature. No URL strings anywhere else.
// Matches ladder-backend (architeture.md §5), except where marked "mock only".
export const ENDPOINTS = {
  auth: {
    signup: '/auth/signup',
    verifyOtp: '/auth/otp/verify',
    resendOtp: '/auth/otp/resend',
    login: '/auth/login',
    createPin: '/auth/pin',
    logout: '/auth/logout',
  },
  verification: {
    bvn: '/verification/bvn',
    nin: '/verification/nin',
    status: '/verification/status',
    /** Mock only: not served by ladder-backend yet (rules.md §11). */
    governmentId: '/verification/government-id',
    /** Mock only: not served by ladder-backend yet (rules.md §11). */
    liveness: '/verification/liveness',
  },
  profile: {
    me: '/profile/me',
  },
} as const;
