// Date of birth input inside the first credential card. Nothing is sent here: the backend has no
// date of birth endpoint, so the confirmed date is sent with each BVN/NIN lookup and must match.
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui';
import { dateOfBirthSchema, type DateOfBirthFormValues } from '../schemas/verification.schema';

type DateOfBirthPanelProps = {
  onConfirm: (dateOfBirth: string) => void;
};

/** Today as YYYY-MM-DD in local time; called from an event handler, never during render. */
function todayIsoDate(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function DateOfBirthPanel({ onConfirm }: DateOfBirthPanelProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DateOfBirthFormValues>({
    resolver: zodResolver(dateOfBirthSchema),
    mode: 'onTouched',
    defaultValues: { dateOfBirth: '' },
  });

  const field = register('dateOfBirth');

  return (
    <form onSubmit={handleSubmit(({ dateOfBirth }) => onConfirm(dateOfBirth))} noValidate>
      <Input
        label="Date of birth"
        type="date"
        autoComplete="bday"
        error={errors.dateOfBirth?.message}
        className="pr-28 focus:border-brand-900"
        {...field}
        onFocus={(event) => {
          event.currentTarget.max = todayIsoDate();
        }}
        rightElement={
          <button
            type="submit"
            disabled={!isValid}
            className="h-9 rounded-pill px-3 text-[15px] font-semibold text-brand-600 hover:bg-brand-500/10 disabled:cursor-not-allowed disabled:text-disabled-text"
          >
            Confirm
          </button>
        }
      />
    </form>
  );
}
