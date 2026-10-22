// One side of a government ID (front, back, or a passport photo page): upload a file or take a photo.
'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/ui';
import { ACCEPTED_ID_FILE_TYPES } from '../schemas/verification.schema';
import type { IdSide } from '../types/verification.types';
import { IdCameraCapture } from './IdCameraCapture';

type IdSideFieldProps = {
  side: IdSide;
  /** Passports have a single photo page instead of a card's front and back. */
  isPassport: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
};

const CARD_ASPECT = 85.6 / 54; // ISO/IEC 7810 ID-1
const PASSPORT_PAGE_ASPECT = 125 / 88; // ID-3 photo page

function copyFor(side: IdSide, isPassport: boolean) {
  if (isPassport) {
    return {
      heading: 'Passport photo page',
      title: 'Upload photo page',
      description: 'Upload or take a clear photo of the page with your picture.',
      guide: 'Fit the photo page inside the frame. Avoid glare and keep it flat.',
    };
  }
  const name = side === 'front' ? 'front' : 'back';
  return {
    heading: side === 'front' ? 'Front of card' : 'Back of card',
    title: `Upload ${name}`,
    description: `Upload or take a clear photo of the ${name} of your ID.`,
    guide: `Fit the ${name} of your card inside the frame. Avoid glare and keep it flat.`,
  };
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.3l1.4-2h5.6l1.4 2h1.3A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function IdSideField({
  side,
  isPassport,
  file,
  onChange,
  error,
  disabled = false,
}: IdSideFieldProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const copy = copyFor(side, isPassport);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[15px] leading-6 font-semibold text-brand-900">{copy.heading}</h2>

      <FileDropzone
        file={file}
        accept={ACCEPTED_ID_FILE_TYPES.join(',')}
        title={copy.title}
        description={copy.description}
        previewAlt={`Preview of the ${copy.heading.toLowerCase()}`}
        disabled={disabled}
        error={error}
        onFileSelect={onChange}
        onClear={() => onChange(null)}
        actions={
          file ? (
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              disabled={disabled}
              className="rounded text-brand-600 hover:underline disabled:opacity-60"
            >
              Take photo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              disabled={disabled}
              className="inline-flex h-9 items-center gap-2 rounded-pill border-[1.5px] border-brand-600 px-4 text-sm font-semibold text-brand-600 hover:bg-brand-500/10 disabled:opacity-60"
            >
              <CameraIcon />
              Take a photo
            </button>
          )
        }
      />

      {isCameraOpen && (
        <IdCameraCapture
          title={copy.heading}
          guideText={copy.guide}
          guideAspect={isPassport ? PASSPORT_PAGE_ASPECT : CARD_ASPECT}
          fileNamePrefix={isPassport ? 'passport-photo-page' : `id-${side}`}
          onCapture={(captured) => {
            onChange(captured);
            setIsCameraOpen(false);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </section>
  );
}
