// Profile screen. NOT DESIGNED YET (rules.md §2): a minimal page so "Go To Profile" has a
// destination. It reuses existing patterns (Ladder ID card, credential check badges) only.
'use client';

import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui';
import { LadderIdCard } from '@/features/verification';
import { useMe } from '../hooks/useMe';
import type { VerifiedItem } from '../types/profile.types';

const ITEM_LABELS: Record<VerifiedItem, string> = {
  dateOfBirth: 'Date of birth',
  bvn: 'BVN',
  nin: 'NIN',
  governmentId: 'Government ID',
  liveness: 'Liveness check',
};

function CheckBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="11" className="fill-success" />
      <path
        d="m7.5 12.3 3 3 6-6.3"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileOverview() {
  const { data: profile, isPending, isError, error, refetch, isRefetching } = useMe();

  return (
    <div className="flex flex-1 flex-col px-7 pt-14 pb-10 lg:px-10">
      <div className="lg:my-auto">
        <Logo className="lg:hidden" />

        <h1 className="mt-12 text-2xl leading-8 font-bold text-brand-900 lg:mt-0 lg:text-[28px] lg:leading-9">
          Your profile
        </h1>

        {isPending ? (
          <div className="mt-6 flex flex-col gap-4" aria-hidden="true">
            <div className="h-6 w-2/3 animate-pulse rounded bg-surface-subtle" />
            <div className="h-[88px] animate-pulse rounded-panel bg-surface-subtle" />
          </div>
        ) : isError ? (
          <div className="mt-6 flex flex-col items-start gap-3" role="alert">
            <p className="text-sm text-danger">{error.message}</p>
            <Button
              variant="secondary"
              onClick={() => void refetch()}
              isLoading={isRefetching}
              className="h-11 w-auto text-base"
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-[15px] leading-6 break-all text-text-muted">{profile.email}</p>

            {profile.ladderId && <LadderIdCard ladderId={profile.ladderId} className="mt-8" />}

            <h2 className="mt-10 text-[17px] leading-6 font-semibold text-brand-900">
              Verified credentials
            </h2>
            <ul className="mt-3 flex flex-col divide-y divide-border rounded-tile border-[1.5px] border-border">
              {profile.verifiedItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 px-4 py-3.5 text-[15px] text-brand-900"
                >
                  <CheckBadge />
                  {ITEM_LABELS[item]}
                  <span className="sr-only">verified</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
