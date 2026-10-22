// The credential cards (Date of Birth first, then BVN, NIN, Government ID) + Continue button.
// BVN, NIN and Government ID stay locked until a date of birth is entered, because the backend
// matches BVN/NIN records against it. The date only lives in this component's state (rules.md §12):
// after a reload it must be entered again to verify another credential.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/layout/BackButton';
import { Button, buttonClasses } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import type { CredentialKind, VerificationStatus } from '../types/verification.types';
import { canLeaveCredentials, hasVerifiedIdNumber } from '../utils/progress';
import { CredentialCard, type CredentialCardState } from './CredentialCard';
import { DateOfBirthPanel } from './DateOfBirthPanel';
import { IdNumberPanel } from './IdNumberPanel';

const CREDENTIAL_ORDER: CredentialKind[] = ['dateOfBirth', 'bvn', 'nin', 'governmentId'];

const CREDENTIAL_COPY: Record<CredentialKind, { title: string; description: string }> = {
  dateOfBirth: {
    title: 'Date of Birth',
    description: 'Enter your date of birth as it appears on your BVN or NIN',
  },
  bvn: { title: 'BVN', description: 'Use your Bank Verification Number' },
  // Copy fixed from the design ("Bank National…"), rules.md §2.
  nin: { title: 'NIN', description: 'Use your National Identification Number' },
  governmentId: { title: 'Government ID', description: 'Upload a valid government issued ID' },
};

const VERIFIED_ANNOUNCEMENTS: Record<CredentialKind, string> = {
  dateOfBirth: 'Date of birth added. You can now verify your BVN, NIN or Government ID.',
  bvn: 'BVN verified.',
  nin: 'NIN verified.',
  governmentId: 'Government ID received.',
};

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5" r="2.6" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M3 13.5c0-2.2 2.2-3.6 5-3.6s5 1.4 5 3.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="3.5"
        width="11"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M2.5 6.5h11M5.5 2v3M10.5 2v3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function cardState(
  kind: CredentialKind,
  status: VerificationStatus,
  dateOfBirth: string | null,
): CredentialCardState {
  // A verified BVN/NIN means the backend matched (and saved) the date of birth entered here.
  if (kind === 'dateOfBirth') {
    return dateOfBirth && hasVerifiedIdNumber(status) ? 'verified' : 'idle';
  }
  const value = status[kind];
  if (value === 'VERIFIED' || (kind === 'governmentId' && value === 'PENDING')) return 'verified';
  if (!dateOfBirth) return 'locked';
  return 'idle';
}

/** "1990-03-15" → "15 March 1990" (parsed as a local date, so no timezone shift). */
function formatDateOfBirth(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function CardsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {CREDENTIAL_ORDER.map((kind) => (
        <div key={kind} className="h-[88px] animate-pulse rounded-tile bg-surface-subtle" />
      ))}
    </div>
  );
}

export function CredentialList() {
  const router = useRouter();
  const completeStep = useOnboardingStore((state) => state.completeStep);
  const selectCredential = useOnboardingStore((state) => state.selectCredential);
  const {
    data: status,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
  } = useVerificationStatus();
  // undefined = the user hasn't toggled anything yet, so fall back to the default below.
  const [expanded, setExpanded] = useState<CredentialKind | null | undefined>(undefined);
  const [announcement, setAnnouncement] = useState('');
  // YYYY-MM-DD, sent with each BVN/NIN lookup. Never stored outside this component.
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);

  // Open the date of birth card by default until there is one: it has to come first.
  const expandedKind =
    expanded !== undefined
      ? expanded
      : status && !dateOfBirth && !canLeaveCredentials(status)
        ? 'dateOfBirth'
        : null;

  const handleVerified = (kind: CredentialKind) => {
    setExpanded(null);
    setAnnouncement(VERIFIED_ANNOUNCEMENTS[kind]);
  };

  const handleContinue = () => {
    completeStep('credentials');
    router.push(ROUTES.LIVENESS);
  };

  const renderPanel = (kind: CredentialKind) => {
    switch (kind) {
      case 'dateOfBirth':
        return (
          <DateOfBirthPanel
            onConfirm={(value) => {
              setDateOfBirth(value);
              handleVerified('dateOfBirth');
            }}
          />
        );
      case 'bvn':
      case 'nin':
        // Locked cards are never expanded, so a date of birth is always there when this shows.
        return dateOfBirth ? (
          <IdNumberPanel
            kind={kind}
            dateOfBirth={dateOfBirth}
            onVerified={() => handleVerified(kind)}
          />
        ) : null;
      case 'governmentId':
        return (
          <div className="flex flex-col gap-3 rounded-tile border-[1.5px] border-border p-4">
            <p className="text-sm leading-5 text-text-muted">
              Upload a clear photo or scan of your ID. You’ll choose the ID type on the next screen.
            </p>
            <Link
              href={ROUTES.UPLOAD_ID}
              onClick={() => selectCredential('government-id')}
              className={buttonClasses('secondary', 'h-11 text-base')}
            >
              Upload ID
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10">
      <div className="lg:my-auto">
        <BackButton />

        <h1 className="mt-10 text-2xl leading-8 font-bold text-brand-900 lg:mt-6 lg:text-[28px] lg:leading-9">
          Verify your credentials
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-text-muted">
          Provide the details below to verify your identity.
        </p>

        <div className="mt-6">
          {isPending ? (
            <CardsSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-start gap-3" role="alert">
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
            <div className="flex flex-col gap-4">
              {CREDENTIAL_ORDER.map((kind) => (
                <CredentialCard
                  key={kind}
                  id={`credential-${kind}`}
                  title={CREDENTIAL_COPY[kind].title}
                  description={
                    kind === 'dateOfBirth' && dateOfBirth
                      ? formatDateOfBirth(dateOfBirth)
                      : CREDENTIAL_COPY[kind].description
                  }
                  icon={kind === 'dateOfBirth' ? <CalendarIcon /> : <PersonIcon />}
                  state={cardState(kind, status, dateOfBirth)}
                  lockedHint="Enter your date of birth first"
                  isExpanded={expandedKind === kind}
                  onToggle={() => setExpanded(expandedKind === kind ? null : kind)}
                >
                  {renderPanel(kind)}
                </CredentialCard>
              ))}
            </div>
          )}
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <Button
          onClick={handleContinue}
          disabled={!status || !canLeaveCredentials(status)}
          className="mt-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
