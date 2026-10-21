// Email + password form, terms footer.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Logo } from '@/components/layout/Logo';
import { Button, Input } from '@/components/ui';
import { LEGAL_LINKS, ROUTES } from '@/config/routes';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useSignup } from '../hooks/useSignup';
import { PASSWORD_HINT, signupSchema, type SignupFormValues } from '../schemas/auth.schema';

const SIGNUP_FIELDS = ['email', 'password'] as const;

function MailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m3.5 6 8.5 7 8.5-7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="10"
        width="15"
        height="10.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="15.2" r="1.4" fill="currentColor" />
    </svg>
  );
}

function EyeIcon({ isCrossedOut }: { isCrossedOut: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      {isCrossedOut && (
        <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function SignupForm() {
  const router = useRouter();
  const startSignup = useOnboardingStore((state) => state.startSignup);
  const signup = useSignup();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: SignupFormValues) => {
    signup.mutate(values, {
      onSuccess: ({ otpExpiresIn }) => {
        // Only the email goes in the store; the password never leaves the form (rules.md §12).
        startSignup(values.email, otpExpiresIn);
        router.push(ROUTES.VERIFY_OTP);
      },
      onError: (error) => {
        let hasFieldError = false;
        for (const field of SIGNUP_FIELDS) {
          const message = error.fieldErrors[field]?.[0];
          if (message) {
            setError(field, { message }, { shouldFocus: !hasFieldError });
            hasFieldError = true;
          }
        }
        if (!hasFieldError) setError('root.server', { message: error.message });
      },
    });
  };

  return (
    <div className="flex flex-1 flex-col px-7 pt-14 pb-10 lg:px-10">
      {/* On desktop the BrandPanel shows the logo, and the form sits centred above the footer. */}
      <div className="lg:mt-auto">
        <Logo className="lg:hidden" />

        <h1 className="mt-12 text-2xl leading-8 font-bold text-brand-900 lg:mt-0 lg:text-[28px] lg:leading-9">
          Create your account
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-text-muted">
          Enter your email address to get started
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
          <Input
            label="Email address"
            placeholder="Email address"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            leftIcon={<MailIcon />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            placeholder="Password"
            type={isPasswordVisible ? 'text' : 'password'}
            autoComplete="new-password"
            autoCapitalize="none"
            spellCheck={false}
            leftIcon={<LockIcon />}
            hint={PASSWORD_HINT}
            error={errors.password?.message}
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
            {errors.root?.server && (
              <p className="text-sm text-danger">{errors.root.server.message}</p>
            )}
          </div>

          <Button type="submit" disabled={!isValid} isLoading={signup.isPending} className="mt-1">
            Continue
          </Button>
        </form>
      </div>

      <p className="mt-auto pt-10 text-center text-[15px] leading-6 text-text-body">
        By continuing, you agree to our
        <br />
        <a href={LEGAL_LINKS.TERMS} className="font-medium text-brand-900 hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href={LEGAL_LINKS.PRIVACY} className="font-medium text-brand-900 hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
