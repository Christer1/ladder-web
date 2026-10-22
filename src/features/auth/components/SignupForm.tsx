// Email + password form, terms footer.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Logo } from '@/components/layout/Logo';
import { Button, EyeIcon, Input, LockIcon, MailIcon } from '@/components/ui';
import { LEGAL_LINKS, ROUTES } from '@/config/routes';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useSignup } from '../hooks/useSignup';
import { PASSWORD_HINT, signupSchema, type SignupFormValues } from '../schemas/auth.schema';

const SIGNUP_FIELDS = ['email', 'password', 'confirmPassword'] as const;

export function SignupForm() {
  const router = useRouter();
  const startSignup = useOnboardingStore((state) => state.startSignup);
  const signup = useSignup();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = (values: SignupFormValues) => {
    signup.mutate(values, {
      onSuccess: ({ resendAvailableIn }) => {
        // Only the email goes in the store; the password never leaves the form (rules.md §12).
        startSignup(values.email, resendAvailableIn);
        router.push(ROUTES.VERIFY_OTP);
      },
      onError: (error) => {
        // The backend sends no field errors with EMAIL_TAKEN, but it belongs under the email.
        if (error.code === 'EMAIL_TAKEN') {
          setError('email', { message: error.message }, { shouldFocus: true });
          return;
        }
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
            // Re-check the confirmation whenever the password changes.
            {...register('password', { deps: ['confirmPassword'] })}
          />

          <Input
            label="Confirm password"
            placeholder="Confirm password"
            type={isConfirmVisible ? 'text' : 'password'}
            autoComplete="new-password"
            autoCapitalize="none"
            spellCheck={false}
            leftIcon={<LockIcon />}
            error={errors.confirmPassword?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setIsConfirmVisible((isVisible) => !isVisible)}
                aria-label={isConfirmVisible ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={isConfirmVisible}
                className="inline-flex size-9 items-center justify-center rounded-full text-text-muted transition-colors hover:text-brand-900"
              >
                <EyeIcon isCrossedOut={isConfirmVisible} />
              </button>
            }
            {...register('confirmPassword')}
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

        <p className="mt-6 text-center text-[15px] leading-6 text-text-muted">
          Already have an account?{' '}
          <Link href={ROUTES.LOGIN} className="font-semibold text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
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
