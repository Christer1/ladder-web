// Shared FileDropzone. Presentational only: no API calls, no feature imports.
// Click, keyboard (Enter/Space on the button) or drag-and-drop. Validation is the caller's job.
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/format';

type FileDropzoneProps = {
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  /** Value for the input's accept attribute, e.g. "image/png,image/jpeg,application/pdf". */
  accept: string;
  title: string;
  description: string;
  error?: string;
  disabled?: boolean;
  className?: string;
};

function CloudUploadIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M15 34h-2.5a9 9 0 0 1-1-17.95A12 12 0 0 1 34.6 13 8.5 8.5 0 0 1 36 34h-3"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 41V24m0 0-6 6m6-6 6 6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5M9 13h6M9 17h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Object URL for image previews, revoked when the file changes or the component unmounts. */
function useImagePreview(file: File | null): string | null {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external resource (object URL)
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    };
  }, [file]);

  return previewUrl;
}

export function FileDropzone({
  file,
  onFileSelect,
  onClear,
  accept,
  title,
  description,
  error,
  disabled = false,
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useImagePreview(file);
  const descriptionId = useId();
  const errorId = useId();

  const openPicker = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0];
    if (picked) onFileSelect(picked);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          'flex min-h-[164px] flex-col items-center justify-center rounded-tile border-[1.5px] border-dashed border-border bg-surface-subtle px-6 py-6 text-center transition-colors',
          isDragging && 'border-brand-500 bg-surface-mint',
          error && 'border-danger',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onChange={(event) => {
            handleFiles(event.target.files);
            // Allow picking the same file again after removing it.
            event.target.value = '';
          }}
        />

        {file ? (
          <div className="flex w-full flex-col items-center gap-3">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL, nothing to optimise
              <img
                src={previewUrl}
                alt="Preview of the selected ID"
                className="max-h-28 rounded-input object-contain"
              />
            ) : (
              <span className="text-brand-600">
                <DocumentIcon />
              </span>
            )}
            <p className="max-w-full truncate text-sm font-medium text-brand-900">
              {file.name}
              <span className="font-normal text-text-muted"> · {formatFileSize(file.size)}</span>
            </p>
            <div className="flex gap-4 text-sm font-semibold">
              <button
                type="button"
                onClick={openPicker}
                disabled={disabled}
                className="rounded text-brand-600 hover:underline disabled:opacity-60"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={disabled}
                className="rounded text-danger hover:underline disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled}
            aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
            className="flex flex-col items-center rounded-input px-4 py-2"
          >
            <span className="text-brand-600">
              <CloudUploadIcon />
            </span>
            <span className="mt-3 text-[15px] font-semibold text-brand-900">{title}</span>
            <span
              id={descriptionId}
              className="mt-2 max-w-[210px] text-[13px] leading-5 text-text-muted"
            >
              {description}
            </span>
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
