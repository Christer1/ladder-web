// Expandable card. States: collapsed, expanded, typing, verifying (spinner), verified (check).
// The header is a disclosure button (aria-expanded); the panel renders below the card as in the design.
// "locked" is for cards that must wait for the date of birth to be verified first.
import { cn } from '@/lib/utils/cn';

export type CredentialCardState = 'idle' | 'locked' | 'verified';

type CredentialCardProps = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  state: CredentialCardState;
  isExpanded: boolean;
  onToggle: () => void;
  /** Shown under the description while the card is locked. */
  lockedHint?: string;
  /** The panel (input, upload link, …) shown below the card when expanded. */
  children?: React.ReactNode;
};

function ChevronIcon({ isUp }: { isUp: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('transition-transform', isUp && 'rotate-180')}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
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

export function CredentialCard({
  id,
  title,
  description,
  icon,
  state,
  isExpanded,
  onToggle,
  lockedHint,
  children,
}: CredentialCardProps) {
  const panelId = `${id}-panel`;
  const isVerified = state === 'verified';
  const isLocked = state === 'locked';
  const isOpen = isExpanded && !isVerified && !isLocked;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        id={`${id}-header`}
        onClick={onToggle}
        disabled={isVerified || isLocked}
        aria-expanded={isOpen}
        aria-controls={children ? panelId : undefined}
        className={cn(
          'flex w-full items-center gap-4 rounded-tile border-[1.5px] border-border bg-surface py-3.5 pr-4 pl-3.5 text-left transition-colors',
          'enabled:hover:border-brand-500/60 disabled:cursor-default',
          isLocked && 'opacity-60',
        )}
      >
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-brand-950 text-white">
          {icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[17px] leading-6 font-semibold text-brand-900">{title}</span>
          <span className="mt-1 max-w-[240px] text-sm leading-5 text-text-muted">
            {description}
          </span>
          {isLocked && lockedHint && (
            <span className="mt-1 text-[13px] leading-5 font-medium text-brand-900">
              {lockedHint}
            </span>
          )}
          {isVerified && <span className="sr-only">Verified</span>}
        </span>
        <span className="flex size-6 shrink-0 items-center justify-center text-brand-900/80">
          {isVerified ? <VerifiedBadge /> : <ChevronIcon isUp={isOpen} />}
        </span>
      </button>

      {children && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${id}-header`}
          hidden={!isOpen}
          className="mt-2"
        >
          {children}
        </div>
      )}
    </div>
  );
}
