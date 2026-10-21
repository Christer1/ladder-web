// Shared Input. Presentational only: no API calls, no feature imports.
'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils/cn';

type InputProps = React.ComponentProps<'input'> & {
  /** Always rendered for screen readers; visible only when isLabelVisible is true. */
  label: string;
  isLabelVisible?: boolean;
  leftIcon?: React.ReactNode;
  /** Interactive element inside the right edge, e.g. a show/hide password button. */
  rightElement?: React.ReactNode;
  /** Helper text under the field; replaced by the error when there is one. */
  hint?: string;
  error?: string;
};

export function Input({
  label,
  isLabelVisible = false,
  leftIcon,
  rightElement,
  hint,
  error,
  id,
  className,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className={cn(!isLabelVisible && 'sr-only', 'text-sm font-medium')}>
        {label}
      </label>
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute top-1/2 left-4 flex -translate-y-1/2 text-brand-900">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-[46px] w-full rounded-input border-[1.5px] border-border bg-surface px-4 text-base text-brand-900 transition-colors outline-none placeholder:text-text-muted',
            'focus:border-brand-500 focus-visible:outline-none aria-invalid:border-danger',
            leftIcon && 'pl-[60px]',
            rightElement && 'pr-12',
            className,
          )}
          {...props}
        />
        {rightElement && (
          <span className="absolute top-1/2 right-1.5 flex -translate-y-1/2">{rightElement}</span>
        )}
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-sm text-text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
