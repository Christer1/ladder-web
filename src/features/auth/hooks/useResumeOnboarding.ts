// After a returning user signs in, send them to the right place. ladder-backend's verification
// status is the only source (no browser state), so the result is the same on any device:
//   has a Ladder ID (verification complete)   → /profile
//   otherwise                                 → the onboarding page they were last on
//                                               (or the first step left, if that page no longer applies)
// The rule (getResumeRoute) is shared with RouteGuard (features/verification/utils/progress.ts).
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  getResumeRoute,
  getVerificationStatus,
  verificationQueryKeys,
} from '@/features/verification';
import type { ApiError } from '@/lib/api/errors';
import { useOnboardingStore } from '@/store/onboarding.store';

export function useResumeOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const completeStep = useOnboardingStore((state) => state.completeStep);
  const [isResuming, setIsResuming] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const resume = useCallback(async () => {
    setIsResuming(true);
    setError(null);
    try {
      const status = await queryClient.fetchQuery({
        queryKey: verificationQueryKeys.status,
        queryFn: getVerificationStatus,
        staleTime: 0,
      });
      // Signing in proves the email was verified.
      completeStep('verify-otp');

      router.replace(getResumeRoute(status));
    } catch (resumeError) {
      setError(resumeError as ApiError);
      setIsResuming(false);
    }
  }, [completeStep, queryClient, router]);

  return { resume, isResuming, error };
}
