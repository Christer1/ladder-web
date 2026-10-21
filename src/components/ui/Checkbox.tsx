// Shared Checkbox. Presentational only: no API calls, no feature imports.
// Interactive by default. With isStatusOnly it renders the same box as a read-only indicator
// (e.g. "File size: up to 5mb" ticks itself when the chosen file passes).
'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils/cn';

type CheckboxProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  label: React.ReactNode;
  isStatusOnly?: boolean;
};

const BOX_CLASSES =
  'flex size-[17px] shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-brand-900 transition-colors';

function CheckMark() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="m2.5 6.2 2.3 2.3L9.5 3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Checkbox({
  label,
  isStatusOnly = false,
  checked,
  id,
  className,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  if (isStatusOnly) {
    return (
      <div className={cn('flex items-center gap-3 text-[15px] text-text-body', className)}>
        <span className={cn(BOX_CLASSES, checked && 'bg-brand-900 text-white')} aria-hidden="true">
          {checked && <CheckMark />}
        </span>
        <span>
          {label}
          <span className="sr-only">{checked ? ' (met)' : ' (not met yet)'}</span>
        </span>
      </div>
    );
  }

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex cursor-pointer items-center gap-3 text-[15px] text-text-body has-disabled:cursor-not-allowed has-disabled:opacity-60',
        className,
      )}
    >
      <span className="relative flex">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed"
          {...props}
        />
        <span
          className={cn(
            BOX_CLASSES,
            'text-transparent peer-checked:bg-brand-900 peer-checked:text-white',
          )}
          aria-hidden="true"
        >
          <CheckMark />
        </span>
      </span>
      <span>{label}</span>
    </label>
  );
}
