// ROUTES constants + ONBOARDING_STEPS order.
export const ROUTES = {
  WELCOME: '/',
  SIGNUP: '/signup',
  LOGIN: '/login',
  VERIFY_OTP: '/verify-otp',
  CREDENTIALS: '/credentials',
  UPLOAD_ID: '/upload-id',
  LIVENESS: '/liveness',
  VERIFIED: '/verified',
  PROFILE: '/profile',
} as const;

/** Legal pages are not built yet; point these at the real URLs once they exist. */
export const LEGAL_LINKS = {
  TERMS: '/terms',
  PRIVACY: '/privacy',
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

export const ONBOARDING_STEPS = [
  'signup',
  'verify-otp',
  'credentials',
  'upload-id',
  'liveness',
  'verified',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
