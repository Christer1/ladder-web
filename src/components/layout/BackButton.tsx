// Top-left back arrow used on every step after Welcome.
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from '@/config/routes';
import { cn } from '@/lib/utils/cn';

type BackButtonProps = {
  /** Where to go. Without it the button goes back in history. */
  href?: Route;
  className?: string;
};

const BASE_CLASSES =
  '-ml-2 inline-flex size-10 items-center justify-center rounded-full text-brand-900 transition-colors hover:bg-brand-900/5';

function ArrowLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 12H4m0 0 6.5-6.5M4 12l6.5 6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackButton({ href, className }: BackButtonProps) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href} aria-label="Go back" className={cn(BASE_CLASSES, className)}>
        <ArrowLeftIcon />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className={cn(BASE_CLASSES, className)}
    >
      <ArrowLeftIcon />
    </button>
  );
}
