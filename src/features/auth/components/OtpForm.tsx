// 6-digit OTP form with countdown + "Resend code".
'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BackButton } from '@/components/layout/BackButton';
import { Button } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { formatCountdown } from '@/lib/utils/format';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useResendOtp } from '../hooks/useResendOtp';
import { useVerifyOtp } from '../hooks/useVerifyOtp';
import { OTP_LENGTH, otpSchema, type OtpFormValues } from '../schemas/auth.schema';
import { OtpInput } from './OtpInput';

export function OtpForm() {
  const router = useRouter();
  const email = useOnboardingStore((state) => state.email);

  // The email only lives in memory: after a refresh, restart signup.
  useEffect(() => {
    if (!email) router.replace(ROUTES.SIGNUP);
  }, [email, router]);

  if (!email) return null;
  return <OtpFormContent email={email} />;
}

function OtpFormContent({ email }: { email: string }) {
  const router = useRouter();
  const otpExpiresIn = useOnboardingStore((state) => state.otpExpiresIn);
  const completeStep = useOnboardingStore((state) => state.completeStep);
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp(otpExpiresIn ?? undefined);
  const [statusMessage, setStatusMessage] = useState('');
  const errorId = useId();

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    mode: 'onChange',
    defaultValues: { code: '' },
  });

  const onSubmit = ({ code }: OtpFormValues) => {
    verifyOtp.mutate(
      { email, code },
      {
        onSuccess: () => {
          completeStep('verify-otp');
          router.push(ROUTES.CREATE_PIN);
        },
        onError: (error) => {
          setError('code', {
            type: 'server',
            message: error.fieldErrors.code?.[0] ?? error.message,
          });
        },
      },
    );
  };

  const handleResend = () => {
    setStatusMessage('');
    resendOtp.mutate(
      { email },
      {
        onSuccess: () => {
          clearErrors('code');
          setStatusMessage('We’ve sent you a new code.');
        },
        onError: (error) => setError('code', { type: 'server', message: error.message }),
      },
    );
  };

  // Only show validation errors that came from the server, not "incomplete code" while typing.
  const codeError = errors.code?.type === 'server' ? errors.code.message : undefined;

  return (
    <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10">
      {/* Centred vertically beside the BrandPanel on desktop. */}
      <div className="lg:my-auto">
        <BackButton href={ROUTES.SIGNUP} />

        <h1 className="mt-7 text-2xl leading-8 font-bold text-brand-900 lg:mt-6 lg:text-[28px] lg:leading-9">
          Enter the OTP
        </h1>
        <p className="mt-2 max-w-[300px] text-[15px] leading-6 text-text-muted">
          We’ve sent a 6-digit code to your email address
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col">
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <OtpInput
                value={field.value}
                onChange={(value) => {
                  if (errors.code) clearErrors('code');
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
                length={OTP_LENGTH}
                hasError={Boolean(codeError)}
                disabled={verifyOtp.isPending}
                describedBy={codeError ? errorId : undefined}
                autoFocus
              />
            )}
          />

          <div aria-live="polite">
            {codeError && (
              <p id={errorId} className="mt-3 text-sm text-danger">
                {codeError}
              </p>
            )}
            {statusMessage && !codeError && <p className="sr-only">{statusMessage}</p>}
          </div>

          <div className="mt-4 flex items-center gap-3 text-[15px] leading-5 font-semibold">
            {resendOtp.secondsLeft > 0 && (
              <span className="text-brand-900 tabular-nums">
                <span className="sr-only">You can resend the code in </span>
                {formatCountdown(resendOtp.secondsLeft)}
              </span>
            )}
            <button
              type="button"
              onClick={handleResend}
              disabled={!resendOtp.canResend}
              className="rounded text-brand-600 hover:underline disabled:cursor-not-allowed disabled:no-underline"
            >
              {resendOtp.isPending ? 'Sending…' : 'Resend code'}
            </button>
          </div>

          <Button
            type="submit"
            disabled={!isValid}
            isLoading={verifyOtp.isPending}
            className="mt-8"
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
