// Date of birth input inside the first credential card. Saved before BVN/NIN so lookups can be matched.
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Spinner } from '@/components/ui';
import { useVerifyDateOfBirth } from '../hooks/useVerifyDateOfBirth';
import { dateOfBirthSchema, type DateOfBirthFormValues } from '../schemas/verification.schema';

type DateOfBirthPanelProps = {
  onVerified: () => void;
};

/** Today as YYYY-MM-DD in local time; called from an event handler, never during render. */
function todayIsoDate(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function DateOfBirthPanel({ onVerified }: DateOfBirthPanelProps) {
  const verifyDateOfBirth = useVerifyDateOfBirth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<DateOfBirthFormValues>({
    resolver: zodResolver(dateOfBirthSchema),
    mode: 'onTouched',
    defaultValues: { dateOfBirth: '' },
  });

  const onSubmit = ({ dateOfBirth }: DateOfBirthFormValues) => {
    verifyDateOfBirth.mutate(
      { dateOfBirth },
      {
        onSuccess: onVerified,
        onError: (error) =>
          setError('dateOfBirth', {
            message: error.fieldErrors.dateOfBirth?.[0] ?? error.message,
          }),
      },
    );
  };

  const field = register('dateOfBirth');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        label="Date of birth"
        type="date"
        autoComplete="bday"
        readOnly={verifyDateOfBirth.isPending}
        error={errors.dateOfBirth?.message}
        className="pr-28 focus:border-brand-900"
        {...field}
        onFocus={(event) => {
          event.currentTarget.max = todayIsoDate();
        }}
        rightElement={
          verifyDateOfBirth.isPending ? (
            <span className="flex h-9 items-center px-3 text-brand-900">
              <Spinner label="Saving date of birth" />
            </span>
          ) : (
            <button
              type="submit"
              disabled={!isValid}
              className="h-9 rounded-pill px-3 text-[15px] font-semibold text-brand-600 hover:bg-brand-500/10 disabled:cursor-not-allowed disabled:text-disabled-text"
            >
              Confirm
            </button>
          )
        }
      />
    </form>
  );
}
