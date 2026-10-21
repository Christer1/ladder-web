// MSW handlers for verification endpoints (delayed BVN/NIN responses to exercise the spinner state).
//
// Test values:
//   date of birth under 18          → UNDERAGE field error
//   BVN/NIN 00000000000             → *_NOT_FOUND
//   BVN/NIN 11111111111             → DOB_MISMATCH (record's date of birth differs)
//   any other 11 digits             → verified after ~1.8s
//   ID file over 5 MB               → FILE_TOO_LARGE
import { delay, http } from 'msw';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  SubmitLivenessResponse,
  VerificationStatus,
  VerifyBvnRequest,
  VerifyCredentialResponse,
  VerifyDateOfBirthRequest,
  VerifyNinRequest,
} from '@/features/verification/types/verification.types';
import { generateLadderId, mockDb } from '../db';
import { fail, ok, requireSession, url } from './http';

const LOOKUP_DELAY_MS = 1800;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function requireDateOfBirth() {
  if (mockDb.get().status.dateOfBirth === 'verified') return null;
  return fail(409, {
    message: 'Verify your date of birth first.',
    code: 'DOB_REQUIRED',
  });
}

function lookupIdNumber(kind: 'BVN' | 'NIN', value: string, field: 'bvn' | 'nin') {
  if (value === '00000000000') {
    const message = `We couldn’t find that ${kind}. Check the number and try again.`;
    return fail(404, { message, code: `${kind}_NOT_FOUND`, errors: { [field]: [message] } });
  }
  if (value === '11111111111') {
    const message = `The date of birth on this ${kind} doesn’t match the one you entered.`;
    return fail(422, { message, code: 'DOB_MISMATCH', errors: { [field]: [message] } });
  }
  mockDb.updateStatus({ [field]: 'verified' });
  return ok<VerifyCredentialResponse>({ status: 'verified' }, `${kind} verified`);
}

export const verificationHandlers = [
  http.get(url(ENDPOINTS.verification.status), async () => {
    await delay(300);
    return requireSession() ?? ok<VerificationStatus>(mockDb.get().status);
  }),

  http.post<never, VerifyDateOfBirthRequest>(
    url(ENDPOINTS.verification.dateOfBirth),
    async ({ request }) => {
      await delay(700);
      const unauthorized = requireSession();
      if (unauthorized) return unauthorized;

      const { dateOfBirth } = await request.json();
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      if (new Date(dateOfBirth) > eighteenYearsAgo) {
        const message = 'You must be at least 18 to get a Ladder ID.';
        return fail(422, { message, code: 'UNDERAGE', errors: { dateOfBirth: [message] } });
      }

      mockDb.updateStatus({ dateOfBirth: 'verified' });
      return ok<VerifyCredentialResponse>({ status: 'verified' }, 'Date of birth saved');
    },
  ),

  http.post<never, VerifyBvnRequest>(url(ENDPOINTS.verification.bvn), async ({ request }) => {
    await delay(LOOKUP_DELAY_MS);
    const blocked = requireSession() ?? requireDateOfBirth();
    if (blocked) return blocked;
    const { bvn } = await request.json();
    return lookupIdNumber('BVN', bvn, 'bvn');
  }),

  http.post<never, VerifyNinRequest>(url(ENDPOINTS.verification.nin), async ({ request }) => {
    await delay(LOOKUP_DELAY_MS);
    const blocked = requireSession() ?? requireDateOfBirth();
    if (blocked) return blocked;
    const { nin } = await request.json();
    return lookupIdNumber('NIN', nin, 'nin');
  }),

  http.post(url(ENDPOINTS.verification.governmentId), async ({ request }) => {
    await delay(1500);
    const blocked = requireSession() ?? requireDateOfBirth();
    if (blocked) return blocked;

    const body = await request.formData();
    const file = body.get('file');
    if (!(file instanceof File)) {
      return fail(400, { message: 'Upload a clear image of your ID.', code: 'FILE_REQUIRED' });
    }
    if (file.size > MAX_FILE_BYTES) {
      const message = 'The file must be 5 MB or smaller.';
      return fail(413, { message, code: 'FILE_TOO_LARGE', errors: { file: [message] } });
    }

    mockDb.updateStatus({ governmentId: 'verified' });
    return ok<VerifyCredentialResponse>({ status: 'verified' }, 'ID received');
  }),

  http.post(url(ENDPOINTS.verification.liveness), async ({ request }) => {
    await delay(2000);
    const unauthorized = requireSession();
    if (unauthorized) return unauthorized;

    const body = await request.formData();
    if (!(body.get('selfie') instanceof File)) {
      return fail(400, {
        message: 'We didn’t receive a photo. Please try again.',
        code: 'SELFIE_REQUIRED',
      });
    }

    const ladderId = mockDb.get().status.ladderId ?? generateLadderId();
    mockDb.updateStatus({ liveness: 'verified', ladderId });
    return ok<SubmitLivenessResponse>({ status: 'verified', ladderId }, 'Liveness verified');
  }),
];
