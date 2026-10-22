// ID type select + front/back (or passport photo page) capture + requirements checklist.
// Each side can be uploaded as a file or photographed in-app. Format and size tick themselves
// when every required image passes; the last item is the user's confirmation.
'use client';

import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BackButton } from '@/components/layout/BackButton';
import { Button, Checkbox, Select } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useUploadGovernmentId } from '../hooks/useUploadGovernmentId';
import {
  GOVERNMENT_ID_OPTIONS,
  MAX_ID_FILE_BYTES,
  getIdSides,
  idUploadSchema,
  isAcceptedIdFileType,
  type IdUploadFormValues,
} from '../schemas/verification.schema';
import type { IdSide } from '../types/verification.types';
import { IdSideField } from './IdSideField';

export function IdUploadForm() {
  const router = useRouter();
  const completeStep = useOnboardingStore((state) => state.completeStep);
  const upload = useUploadGovernmentId();

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isValid },
  } = useForm<IdUploadFormValues>({
    resolver: zodResolver(idUploadSchema),
    mode: 'onChange',
    defaultValues: {
      idType: undefined,
      front: undefined,
      back: undefined,
      isConfirmedValid: false,
    },
  });

  const [idType, front, back] = useWatch({ control, name: ['idType', 'front', 'back'] });
  const sides = getIdSides(idType);
  const isPassport = idType === 'international-passport';
  const files: Record<IdSide, File | undefined> = { front, back };
  const requiredFiles = sides.map((side) => files[side]);
  const hasAllFiles = requiredFiles.every(Boolean);
  const isFormatOk =
    hasAllFiles && requiredFiles.every((file) => file && isAcceptedIdFileType(file));
  const isSizeOk =
    hasAllFiles && requiredFiles.every((file) => file && file.size <= MAX_ID_FILE_BYTES);

  // Images are set with setValue (never registered as inputs), so clear them the same way:
  // resetField() is a no-op for unregistered fields.
  const setSideFile = (side: IdSide, file: File | null) => {
    setValue(side, file ?? (undefined as unknown as File), {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
  };

  /** Validation errors only once there is a file (or the server rejected it). */
  const sideError = (side: IdSide) => {
    const error = errors[side];
    return files[side] || error?.type === 'server' ? error?.message : undefined;
  };

  const onSubmit = (values: IdUploadFormValues) => {
    const submittedSides = getIdSides(values.idType);
    upload.mutate(
      {
        idType: values.idType,
        front: values.front,
        back: submittedSides.includes('back') ? values.back : undefined,
      },
      {
        onSuccess: () => {
          completeStep('upload-id');
          router.push(ROUTES.LIVENESS);
        },
        onError: (error) => {
          let hasFieldError = false;
          for (const side of submittedSides) {
            const message = error.fieldErrors[side]?.[0];
            if (message) {
              setError(side, { type: 'server', message });
              hasFieldError = true;
            }
          }
          if (!hasFieldError) setError('root.server', { message: error.message });
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10"
    >
      <div className="lg:mt-auto">
        <BackButton href={ROUTES.CREDENTIALS} />

        <h1 className="mt-10 text-2xl leading-8 font-bold text-brand-900 lg:mt-6 lg:text-[28px] lg:leading-9">
          Upload your ID
        </h1>

        <div className="mt-8">
          <Controller
            control={control}
            name="idType"
            render={({ field, fieldState }) => (
              <Select
                label="Select ID"
                placeholder="Select your ID type"
                options={GOVERNMENT_ID_OPTIONS}
                name={field.name}
                value={field.value ?? ''}
                onChange={(event) => {
                  const nextType = event.target.value as IdUploadFormValues['idType'];
                  field.onChange(nextType);
                  // Passports have no back: drop any back image picked for a card.
                  if (!getIdSides(nextType).includes('back')) setSideFile('back', null);
                }}
                onBlur={field.onBlur}
                ref={field.ref}
                disabled={upload.isPending}
                error={fieldState.isTouched ? fieldState.error?.message : undefined}
              />
            )}
          />
          {idType && (
            <p className="mt-2 text-sm leading-5 text-text-muted">
              {isPassport
                ? 'We need a photo of the page with your picture.'
                : 'We need photos of the front and the back of your card.'}
            </p>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-6">
          {sides.map((side) => (
            <IdSideField
              key={side}
              side={side}
              isPassport={isPassport}
              file={files[side] ?? null}
              onChange={(file) => setSideFile(side, file)}
              error={sideError(side)}
              disabled={upload.isPending}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <Checkbox isStatusOnly checked={isFormatOk} label="Accepted Format: PNG, JPG or PDF" />
          <Checkbox isStatusOnly checked={isSizeOk} label="File size: up to 5mb" />
          <Checkbox
            label="Valid government issued ID"
            disabled={upload.isPending}
            {...register('isConfirmedValid')}
          />
        </div>

        <div aria-live="polite" className="mt-4">
          {errors.root?.server && (
            <p className="text-sm text-danger">{errors.root.server.message}</p>
          )}
          {upload.isPending && (
            <p className="sr-only">Uploading your ID, {upload.progress} percent complete</p>
          )}
        </div>
      </div>

      {/* Pinned to the bottom on mobile (rules.md §6). */}
      <div className="mt-auto pt-8 lg:mt-8 lg:mb-auto">
        <Button type="submit" disabled={!isValid} isLoading={upload.isPending}>
          {upload.isPending ? `Uploading… ${upload.progress}%` : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
