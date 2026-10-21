// BVN / NIN input inside a credential card. Submits automatically once all 11 digits are entered,
// shows the spinner while the lookup runs, and reports field errors inline.
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Spinner } from '@/components/ui';
import type { ApiError } from '@/lib/api/errors';
import { useVerifyBvn } from '../hooks/useVerifyBvn';
import { useVerifyNin } from '../hooks/useVerifyNin';
import {
  ID_NUMBER_LENGTH,
  idNumberSchemas,
  type IdNumberFormValues,
} from '../schemas/verification.schema';

type IdNumberKind = 'bvn' | 'nin';

type IdNumberPanelProps = {
  kind: IdNumberKind;
  onVerified: () => void;
};

const LABELS: Record<IdNumberKind, string> = { bvn: 'BVN', nin: 'NIN' };

export function IdNumberPanel({ kind, onVerified }: IdNumberPanelProps) {
  // Both hooks are always called (rules of hooks); only the one for this kind is used.
  const verifyBvn = useVerifyBvn();
  const verifyNin = useVerifyNin();
  const label = LABELS[kind];
  const isPending = kind === 'bvn' ? verifyBvn.isPending : verifyNin.isPending;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<IdNumberFormValues>({
    resolver: zodResolver(idNumberSchemas[kind]),
    defaultValues: { value: '' },
  });

  const onSubmit = ({ value }: IdNumberFormValues) => {
    const options = {
      onSuccess: onVerified,
      onError: (error: ApiError) =>
        setError('value', { message: error.fieldErrors[kind]?.[0] ?? error.message }),
    };
    if (kind === 'bvn') verifyBvn.mutate({ bvn: value }, options);
    else verifyNin.mutate({ nin: value }, options);
  };

  const field = register('value');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        label={`${label} number`}
        placeholder={`Enter your ${label} number`}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={ID_NUMBER_LENGTH}
        autoComplete="off"
        spellCheck={false}
        readOnly={isPending}
        error={errors.value?.message}
        className="focus:border-brand-900"
        {...field}
        onChange={(event) => {
          event.target.value = event.target.value.replace(/\D/g, '').slice(0, ID_NUMBER_LENGTH);
          void field.onChange(event);
          if (event.target.value.length === ID_NUMBER_LENGTH) void handleSubmit(onSubmit)();
        }}
        rightElement={
          isPending ? (
            <span className="flex size-9 items-center justify-center text-brand-900">
              <Spinner label={`Verifying ${label}`} />
            </span>
          ) : undefined
        }
      />
    </form>
  );
}
