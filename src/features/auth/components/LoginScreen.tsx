// Login screen (not designed: built from the signup/OTP patterns, rules.md §2).
// Email + password; a remembered email is pre-filled. After signing in, the user continues
// onboarding wherever they stopped (useResumeOnboarding).
'use client';

import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { Spinner } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useRememberedAccount } from '../utils/remembered-account';
import { LoginForm } from './LoginForm';

export function LoginScreen() {
  const rememberedEmail = useRememberedAccount();

  return (
    <div className="flex flex-1 flex-col px-7 pt-14 pb-10 lg:px-10">
      {/* Centred above the footer on desktop, where the BrandPanel shows the logo. */}
      <div className="lg:mt-auto">
        <Logo className="lg:hidden" />

        {rememberedEmail === undefined ? (
          // Before hydration we can't read the remembered email to pre-fill the form.
          <div className="mt-16 flex justify-center text-brand-500">
            <Spinner label="Loading" />
          </div>
        ) : (
          <LoginForm initialEmail={rememberedEmail ?? ''} />
        )}
      </div>

      <p className="mt-auto pt-10 text-center text-[15px] leading-6 text-text-body">
        New to Ladder?{' '}
        <Link href={ROUTES.SIGNUP} className="font-medium text-brand-900 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
