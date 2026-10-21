// Shared Select. Presentational only: no API calls, no feature imports.
// A styled native <select>: keyboard, screen-reader and mobile pickers work out of the box.
'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils/cn';

type SelectOption = { value: string; label: string };

type SelectProps = Omit<React.ComponentProps<'select'>, 'children'> & {
  label: string;
  isLabelVisible?: boolean;
  options: ReadonlyArray<SelectOption>;
  /** Shown as the first, unselectable option while nothing is chosen. */
  placeholder?: string;
  error?: string;
};

export function Select({
  label,
  isLabelVisible = true,
  options,
  placeholder,
  error,
  id,
  className,
  value,
  defaultValue,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;
  const isEmpty = (value ?? defaultValue ?? '') === '';

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={selectId}
        className={cn(!isLabelVisible && 'sr-only', 'text-lg leading-6 text-text-body')}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-12 w-full appearance-none rounded-input border-[1.5px] border-border bg-surface pr-12 pl-4 text-base transition-colors outline-none',
            'focus:border-brand-500 focus-visible:outline-none aria-invalid:border-danger',
            isEmpty ? 'text-text-muted' : 'text-brand-900',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-brand-900">
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-brand-900"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
