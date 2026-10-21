// "Your Ladder ID" panel with a copy button. Used on /verified and /profile.
'use client';

import { useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { cn } from '@/lib/utils/cn';

const COPIED_RESET_MS = 2000;

function CopyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="7" width="11" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 16.5V5.5A2.5 2.5 0 0 1 7.5 3H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LadderIdCard({ ladderId, className }: { ladderId: string; className?: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const handleCopy = async () => {
    const isCopied = await copyToClipboard(ladderId);
    setCopyState(isCopied ? 'copied' : 'failed');
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), COPIED_RESET_MS);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-panel bg-surface-mint px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm leading-5 font-medium text-brand-600">Your Ladder ID</p>
        <p className="mt-1 truncate text-[22px] leading-8 font-bold tracking-wide text-brand-900">
          {ladderId}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={copyState === 'copied' ? 'Ladder ID copied' : 'Copy Ladder ID'}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-brand-550 shadow-sm transition-colors hover:text-brand-900"
      >
        {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
      </button>
      <p aria-live="polite" className="sr-only">
        {copyState === 'copied'
          ? 'Ladder ID copied to clipboard'
          : copyState === 'failed'
            ? 'Couldn’t copy. Select the ID and copy it manually.'
            : ''}
      </p>
    </div>
  );
}
