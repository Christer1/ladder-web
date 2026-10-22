// Create + confirm 6-digit PIN form.
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BackButton } from '@/components/layout/BackButton';
import { Button, Input } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useCreatePin } from '../hooks/useCreatePin';
import { PIN_LENGTH, pinSchema, type PinFormValues } from '../schemas/auth.schema';

const PIN_FIELDS = ['pin', 'confirmPin'] as const;

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, PIN_LENGTH);

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="10"
        width="15"
        height="10.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 14.2v2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PinForm() {
  const router = useRouter();
  const hasVerifiedOtp = useOnboardingStore((state) => state.completedSteps.includes('verify-otp'));

  // Flow state only lives in memory: after a refresh, restart signup.
  useEffect(() => {
    if (!hasVerifiedOtp) router.replace(ROUTES.SIGNUP);
  }, [hasVerifiedOtp, router]);

  if (!hasVerifiedOtp) return null;
  return <PinFormContent />;
}

function PinFormContent() {
  const router = useRouter();
  const completeStep = useOnboardingStore((state) => state.completeStep);
  const createPin = useCreatePin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<PinFormValues>({
    resolver: zodResolver(pinSchema),
    mode: 'onTouched',
    defaultValues: { pin: '', confirmPin: '' },
  });

  const onSubmit = (values: PinFormValues) => {
    const goToCredentials = () => {
      completeStep('create-pin');
      router.push(ROUTES.CREDENTIALS);
    };

    createPin.mutate(values, {
      onSuccess: goToCredentials,
      onError: (error) => {
        // Came back to this screen after the PIN was saved: nothing to do here any more.
        if (error.code === 'PIN_ALREADY_SET') {
          goToCredentials();
          return;
        }
        let hasFieldError = false;
        for (const field of PIN_FIELDS) {
          const message = error.fieldErrors[field]?.[0];
          if (message) {
            setError(field, { message }, { shouldFocus: !hasFieldError });
            hasFieldError = true;
          }
        }
        if (!hasFieldError) setError('root.server', { message: error.message });
      },
    });
  };

  // Strip non-digits before React Hook Form sees the value.
  const pinInput = (name: (typeof PIN_FIELDS)[number]) => {
    const field = register(name);
    return {
      ...field,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        event.target.value = digitsOnly(event.target.value);
        return field.onChange(event);
      },
    };
  };

  return (
    <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10">
      <div className="lg:my-auto">
        <BackButton />

        <h1 className="mt-7 text-2xl leading-8 font-bold text-brand-900 lg:mt-6 lg:text-[28px] lg:leading-9">
          Create your PIN
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-text-muted">
          This PIN will be used to log in to your Ladder account
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
          <Input
            label="Create your 6-digit PIN"
            placeholder="Create your 6-digit PIN"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={PIN_LENGTH}
            autoComplete="new-password"
            leftIcon={<LockIcon />}
            error={errors.pin?.message}
            {...pinInput('pin')}
          />
          <Input
            label="Confirm your 6-digit PIN"
            placeholder="Confirm your 6-digit PIN"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={PIN_LENGTH}
            autoComplete="new-password"
            leftIcon={<LockIcon />}
            error={errors.confirmPin?.message}
            {...pinInput('confirmPin')}
          />

          <div aria-live="polite">
            {errors.root?.server && (
              <p className="text-sm text-danger">{errors.root.server.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!isValid}
            isLoading={createPin.isPending}
            className="mt-1"
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
