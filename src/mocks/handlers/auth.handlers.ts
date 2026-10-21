// MSW handlers for auth endpoints.
//
// Test values:
//   OTP 123456                  → success; any other 6 digits → OTP_INVALID
//   email taken@ladder.test     → EMAIL_TAKEN field error on signup
//   email down@ladder.test      → 500 on signup (generic error path)
//   password password1          → PASSWORD_WEAK field error on signup
//   PIN 123456 / 000000         → PIN_TOO_SIMPLE field error
import { delay, http } from 'msw';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  CreatePinRequest,
  ResendOtpRequest,
  ResendOtpResponse,
  SignupRequest,
  SignupResponse,
  VerifyOtpRequest,
} from '@/features/auth/types/auth.types';
import { mockDb } from '../db';
import { fail, ok, requireSession, url } from './http';

export const MOCK_VALID_OTP = '123456';
const OTP_EXPIRES_IN = 45;
const SIMPLE_PINS = ['123456', '000000', '111111', '654321'];

export const authHandlers = [
  http.post<never, SignupRequest>(url(ENDPOINTS.auth.signup), async ({ request }) => {
    await delay(600);
    const { email, password } = await request.json();

    if (password === 'password1') {
      return fail(422, {
        message: 'Choose a less common password.',
        code: 'PASSWORD_WEAK',
        errors: { password: ['This password is too common. Choose another one.'] },
      });
    }
    if (email === 'taken@ladder.test') {
      return fail(409, {
        message: 'An account with this email already exists.',
        code: 'EMAIL_TAKEN',
        errors: { email: ['An account with this email already exists.'] },
      });
    }
    if (email === 'down@ladder.test') {
      return fail(500, { message: 'Something went wrong. Please try again.', code: 'INTERNAL' });
    }

    mockDb.startSignup(email);
    return ok<SignupResponse>({ otpExpiresIn: OTP_EXPIRES_IN }, 'OTP sent');
  }),

  http.post<never, VerifyOtpRequest>(url(ENDPOINTS.auth.verifyOtp), async ({ request }) => {
    await delay(600);
    const { code } = await request.json();

    if (code !== MOCK_VALID_OTP) {
      return fail(400, {
        message: 'That code is incorrect or has expired.',
        code: 'OTP_INVALID',
        errors: { code: ['That code is incorrect or has expired.'] },
      });
    }

    // The real backend sets an httpOnly session cookie here (rules.md §8.6).
    mockDb.startSession();
    return ok({}, 'Email verified');
  }),

  http.post<never, ResendOtpRequest>(url(ENDPOINTS.auth.resendOtp), async () => {
    await delay(500);
    return ok<ResendOtpResponse>({ otpExpiresIn: OTP_EXPIRES_IN }, 'OTP resent');
  }),

  http.post<never, CreatePinRequest>(url(ENDPOINTS.auth.createPin), async ({ request }) => {
    await delay(500);
    const unauthorized = requireSession();
    if (unauthorized) return unauthorized;

    const { pin, confirmPin } = await request.json();
    if (pin !== confirmPin) {
      return fail(422, {
        message: 'PINs do not match.',
        code: 'PIN_MISMATCH',
        errors: { confirmPin: ['PINs do not match.'] },
      });
    }
    if (SIMPLE_PINS.includes(pin)) {
      return fail(422, {
        message: 'Choose a PIN that is harder to guess.',
        code: 'PIN_TOO_SIMPLE',
        errors: { pin: ['This PIN is too easy to guess. Avoid repeated or sequential digits.'] },
      });
    }
    return ok({}, 'PIN created');
  }),
];
