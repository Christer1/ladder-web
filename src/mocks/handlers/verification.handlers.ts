// MSW handlers for the verification steps ladder-backend does not serve yet.
// BVN and NIN go to the real backend untouched; GET /verification/status goes there too and gets
// the mocked governmentId / liveness statuses added.
//
// Test values:
//   ID front/back over 5 MB         → FILE_TOO_LARGE (on that side)
//   card ID without a back image    → BACK_REQUIRED (passports only need the front)
import { delay, http } from 'msw';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  SubmitLivenessResponse,
  VerificationResultResponse,
  VerificationStatus,
} from '@/features/verification/types/verification.types';
import { generateLadderId, mockDb } from '../db';
import { fail, ok, passthroughAndExtend, url } from './http';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const verificationHandlers = [
  http.get(url(ENDPOINTS.verification.status), ({ request }) =>
    passthroughAndExtend<VerificationStatus>(request, (status) => {
      const { governmentId, liveness, ladderId } = mockDb.get();
      return { ...status, governmentId, liveness, ladderId: status.ladderId ?? ladderId };
    }),
  ),

  http.post(url(ENDPOINTS.verification.governmentId), async ({ request }) => {
    await delay(1500);

    const body = await request.formData();
    const sides = body.get('idType') === 'international-passport' ? ['front'] : ['front', 'back'];
    for (const side of sides) {
      const file = body.get(side);
      if (!(file instanceof File)) {
        const message = `Add a photo of the ${side} of your ID.`;
        return fail(400, {
          message,
          code: `${side.toUpperCase()}_REQUIRED`,
          errors: { [side]: [message] },
        });
      }
      if (file.size > MAX_FILE_BYTES) {
        const message = 'The file must be 5 MB or smaller.';
        return fail(413, { message, code: 'FILE_TOO_LARGE', errors: { [side]: [message] } });
      }
    }

    mockDb.update({ governmentId: 'VERIFIED' });
    return ok<VerificationResultResponse>({ status: 'VERIFIED', ladderId: null }, 'ID received');
  }),

  http.post(url(ENDPOINTS.verification.liveness), async ({ request }) => {
    await delay(2000);

    const body = await request.formData();
    if (!(body.get('selfie') instanceof File)) {
      return fail(400, {
        message: 'We didn’t receive a photo. Please try again.',
        code: 'SELFIE_REQUIRED',
      });
    }

    // Only a fallback: GET /verification/status prefers the Ladder ID issued by the backend.
    const ladderId = mockDb.get().ladderId ?? generateLadderId();
    mockDb.update({ liveness: 'VERIFIED', ladderId });
    return ok<SubmitLivenessResponse>({ status: 'VERIFIED', ladderId }, 'Liveness verified');
  }),
];
