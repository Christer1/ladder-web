// ID type select + dropzone + requirements checklist.
// Format and size tick themselves when the chosen file passes; the last item is the user's confirmation.
'use client';

import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BackButton } from '@/components/layout/BackButton';
import { Button, Checkbox, FileDropzone, Select } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useUploadGovernmentId } from '../hooks/useUploadGovernmentId';
import {
  ACCEPTED_ID_FILE_TYPES,
  GOVERNMENT_ID_OPTIONS,
  MAX_ID_FILE_BYTES,
  idUploadSchema,
  isAcceptedIdFileType,
  type IdUploadFormValues,
} from '../schemas/verification.schema';

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
    resetField,
    formState: { errors, isValid },
  } = useForm<IdUploadFormValues>({
    resolver: zodResolver(idUploadSchema),
    mode: 'onChange',
    defaultValues: { idType: undefined, file: undefined, isConfirmedValid: false },
  });

  const file = useWatch({ control, name: 'file' });
  const isFormatOk = Boolean(file && isAcceptedIdFileType(file));
  const isSizeOk = Boolean(file && file.size <= MAX_ID_FILE_BYTES);

  const onSubmit = ({ idType, file: idFile }: IdUploadFormValues) => {
    upload.mutate(
      { idType, file: idFile },
      {
        onSuccess: () => {
          completeStep('upload-id');
          router.push(ROUTES.LIVENESS);
        },
        onError: (error) => {
          const fileMessage = error.fieldErrors.file?.[0];
          if (fileMessage) setError('file', { message: fileMessage });
          else setError('root.server', { message: error.message });
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
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
                ref={field.ref}
                disabled={upload.isPending}
                error={fieldState.isTouched ? fieldState.error?.message : undefined}
              />
            )}
          />
        </div>

        <FileDropzone
          className="mt-12"
          file={file ?? null}
          accept={ACCEPTED_ID_FILE_TYPES.join(',')}
          title="Upload your ID"
          description="Upload a clear image of your Government ID."
          disabled={upload.isPending}
          error={file ? errors.file?.message : undefined}
          onFileSelect={(picked) =>
            setValue('file', picked, { shouldValidate: true, shouldTouch: true, shouldDirty: true })
          }
          onClear={() => resetField('file')}
        />

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
