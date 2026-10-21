// Success badge, Ladder ID with copy button, "Go To Profile".
'use client';

import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { buttonClasses } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import { LadderIdCard } from './LadderIdCard';

function SuccessBadge() {
  return (
    <svg width="98" height="98" viewBox="0 0 98 98" aria-hidden="true">
      <circle cx="49" cy="49" r="49" className="fill-brand-550" />
      <path
        d="m31 50 12.5 12.5L68 37"
        fill="none"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function VerifiedSummary() {
  // RouteGuard only shows this page once liveness is verified and a Ladder ID exists.
  const { data: status } = useVerificationStatus();

  return (
    <div className="flex flex-1 flex-col items-center px-7 pt-14 pb-10 text-center lg:px-10">
      <div className="flex w-full flex-col items-center lg:my-auto">
        <Logo className="lg:hidden" />

        <div className="mt-12 lg:mt-0">
          <SuccessBadge />
        </div>

        <h1 className="mt-12 text-[22px] leading-8 font-bold text-black">You’re Verified!</h1>
        <p className="mt-3 max-w-[300px] text-[15px] leading-[21px] text-text-muted">
          Your identity has been successfully verified. You can now use your Ladder ID with
          participating companies
        </p>

        {status?.ladderId && (
          <LadderIdCard ladderId={status.ladderId} className="mt-14 w-full text-left" />
        )}

        <Link href={ROUTES.PROFILE} className={buttonClasses('primary', 'mt-18')}>
          Go To Profile
        </Link>
      </div>
    </div>
  );
}
