// Email + password sign-in. On success the user continues onboarding wherever they stopped
// (useResumeOnboarding). An email that was never verified gets a new code and continues at /verify-otp.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, EyeIcon, Input, LockIcon, MailIcon } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useLogin } from '../hooks/useLogin';
import { DEFAULT_OTP_COUNTDOWN_SECONDS, useResendOtp } from '../hooks/useResendOtp';
import { useResumeOnboarding } from '../hooks/useResumeOnboarding';
import { loginSchema, type LoginFormValues } from '../schemas/auth.schema';
import { rememberAccount } from '../utils/remembered-account';

type LoginFormProps = {
  /** Email remembered on this device, pre-filled so only the password is needed. */
  initialEmail: string;
};

const LOGIN_FIELDS = ['email', 'password'] as const;

export function LoginForm({ initialEmail }: LoginFormProps) {
  const router = useRouter();
  const startSignup = useOnboardingStore((state) => state.startSignup);
  const login = useLogin();
  const resendOtp = useResendOtp();
  const { resume, isResuming, error: resumeError } = useResumeOnboarding();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: initialEmail, password: '' },
  });

  const isBusy = login.isPending || resendOtp.isPending || isResuming;

  // The account never finished email verification: send a fresh code and pick up there.
  const continueEmailVerification = (email: string) => {
    resendOtp.mutate(
      { email },
      {
        onSuccess: ({ resendAvailableIn }) => {
          startSignup(email, resendAvailableIn);
          router.push(ROUTES.VERIFY_OTP);
        },
        onError: (error) => {
          // A code was sent moments ago: it is still valid, so continue with it.
          if (error.code === 'OTP_RESEND_TOO_SOON') {
            startSignup(email, DEFAULT_OTP_COUNTDOWN_SECONDS);
            router.push(ROUTES.VERIFY_OTP);
          } else {
            setError('root.server', { message: error.message });
          }
        },
      },
    );
  };

  const onSubmit = ({ email, password }: LoginFormValues) => {
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          rememberAccount(email);
          void resume();
        },
        onError: (error) => {
          if (error.code === 'EMAIL_NOT_VERIFIED') {
            continueEmailVerification(email);
            return;
          }
          let hasFieldError = false;
          for (const field of LOGIN_FIELDS) {
            const message = error.fieldErrors[field]?.[0];
            if (message) {
              setError(field, { message }, { shouldFocus: !hasFieldError });
              hasFieldError = true;
            }
          }
          if (!hasFieldError) setError('root.server', { message: error.message });
        },
      },
    );
  };

  const formError = errors.root?.server?.message ?? resumeError?.message;

  return (
    <>
      <h1 className="mt-12 text-2xl leading-8 font-bold text-brand-900 lg:mt-0 lg:text-[28px] lg:leading-9">
        Welcome back
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-text-muted">
        Sign in with your email and password
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <Input
          label="Email address"
          placeholder="Email address"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          leftIcon={<MailIcon />}
          error={errors.email?.message}
          disabled={isBusy}
          {...register('email')}
        />
        <Input
          label="Password"
          placeholder="Password"
          type={isPasswordVisible ? 'text' : 'password'}
          autoComplete="current-password"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus={Boolean(initialEmail)}
          leftIcon={<LockIcon />}
          error={errors.password?.message}
          disabled={isBusy}
          rightElement={
            <button
              type="button"
              onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={isPasswordVisible}
              className="inline-flex size-9 items-center justify-center rounded-full text-text-muted transition-colors hover:text-brand-900"
            >
              <EyeIcon isCrossedOut={isPasswordVisible} />
            </button>
          }
          {...register('password')}
        />

        <div aria-live="polite">
          {formError && <p className="text-sm text-danger">{formError}</p>}
        </div>

        <Button type="submit" disabled={!isValid} isLoading={isBusy} className="mt-1">
          Sign in
        </Button>
      </form>
    </>
  );
}
