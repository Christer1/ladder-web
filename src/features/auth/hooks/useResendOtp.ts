// useMutation wrapper around auth.api.resendOtp + countdown timer state.
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';
import { resendOtp } from '../api/auth.api';
import type { ResendOtpRequest, ResendOtpResponse } from '../types/auth.types';

/** Used when signup did not say when a new code can be sent (matches the 00:45 in the design). */
export const DEFAULT_OTP_COUNTDOWN_SECONDS = 45;

export function useResendOtp(initialSeconds: number = DEFAULT_OTP_COUNTDOWN_SECONDS) {
  // Track a deadline rather than decrementing, so throttled background tabs stay accurate.
  const [deadline, setDeadline] = useState(() => Date.now() + initialSeconds * 1000);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [deadline]);

  const mutation = useMutation<ResendOtpResponse, ApiError, ResendOtpRequest>({
    mutationFn: resendOtp,
    onSuccess: ({ resendAvailableIn }) => setDeadline(Date.now() + resendAvailableIn * 1000),
  });

  return {
    ...mutation,
    secondsLeft,
    canResend: secondsLeft === 0 && !mutation.isPending,
  };
}
