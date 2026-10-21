// 6 single-digit boxes; paste, backspace and auto-advance handling.
'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils/cn';

type OtpInputProps = {
  /** Digits entered so far. A space marks an empty box in the middle of the code. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  length?: number;
  hasError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** id of the element describing the group, e.g. an error message. */
  describedBy?: string;
};

const EMPTY = ' ';

export function OtpInput({
  value,
  onChange,
  onBlur,
  length = 6,
  hasError = false,
  disabled = false,
  autoFocus = false,
  describedBy,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length }, (_, i) => (value[i] && value[i] !== EMPTY ? value[i] : ''));

  const focusBox = (index: number) => {
    const target = inputsRef.current[Math.max(0, Math.min(length - 1, index))];
    target?.focus();
    target?.select();
  };

  const commit = (next: string[]) => {
    onChange(
      next
        .map((char) => char || EMPTY)
        .join('')
        .trimEnd(),
    );
  };

  // Writes digits starting at `index`; handles typing, paste and SMS/email autofill alike.
  const fillFrom = (index: number, digits: string) => {
    const next = [...chars];
    const accepted = digits.slice(0, length - index).split('');
    accepted.forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    commit(next);
    focusBox(index + accepted.length);
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      const next = [...chars];
      next[index] = '';
      commit(next);
      return;
    }
    // A single keystroke into a filled box arrives as "old+new"; keep the newest digit.
    fillFrom(index, raw.length === 2 && chars[index] ? digits.slice(-1) : digits);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Backspace':
        if (!chars[index] && index > 0) {
          event.preventDefault();
          const next = [...chars];
          next[index - 1] = '';
          commit(next);
          focusBox(index - 1);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        focusBox(index - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        focusBox(index + 1);
        break;
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!digits) return;
    event.preventDefault();
    // A full code always fills from the first box, wherever the cursor is.
    fillFrom(digits.length >= length ? 0 : index, digits);
  };

  return (
    <div
      role="group"
      aria-label="One-time code"
      aria-describedby={describedBy}
      className="grid grid-cols-6 gap-[11px]"
    >
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={hasError || undefined}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          value={char}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={onBlur}
          className={cn(
            'h-[62px] w-full min-w-0 rounded-otp border-[1.5px] border-border bg-surface text-center text-2xl font-semibold text-brand-900 caret-brand-500 transition-colors outline-none',
            'focus:border-2 focus:border-brand-500 focus-visible:outline-none disabled:opacity-60',
            hasError && 'border-danger',
          )}
        />
      ))}
    </div>
  );
}
