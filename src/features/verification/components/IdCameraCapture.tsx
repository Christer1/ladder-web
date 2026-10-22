// Full-screen camera (centred panel from md up) for photographing one side of an ID.
// Prefers the back camera, shows a document-shaped guide, then Retake / Use photo.
// A native <dialog> opened with showModal() gives focus trapping, Escape and an inert page.
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button, Spinner } from '@/components/ui';
import { useCamera } from '../hooks/useCamera';

type IdCameraCaptureProps = {
  /** e.g. "Front of card". */
  title: string;
  /** Instruction under the viewfinder. */
  guideText: string;
  /** Width / height of the guide frame: ~1.586 for cards (ID-1), ~1.42 for a passport photo page. */
  guideAspect: number;
  /** Base name for the captured file, e.g. "id-front". */
  fileNamePrefix: string;
  onCapture: (file: File) => void;
  onClose: () => void;
};

type Snapshot = { blob: Blob; url: string };

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IdCameraCapture({
  title,
  guideText,
  guideAspect,
  fileNamePrefix,
  onCapture,
  onClose,
}: IdCameraCaptureProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const {
    videoRef,
    status: cameraStatus,
    error: cameraError,
    start: startCamera,
    stop: stopCamera,
    captureFrame,
  } = useCamera({ facing: 'environment' });
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  // Mirrors `snapshot` so the unmount cleanup can revoke the latest preview URL.
  const snapshotUrlRef = useRef<string | null>(null);

  // Open as a modal and start the camera; close and release both on unmount.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    void startCamera();
    return () => {
      stopCamera();
      if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
      if (dialog?.open) dialog.close();
    };
  }, [startCamera, stopCamera]);

  const clearSnapshot = () => {
    if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
    snapshotUrlRef.current = null;
    setSnapshot(null);
  };

  const handleShutter = async () => {
    setCaptureError(null);
    try {
      const blob = await captureFrame();
      const url = URL.createObjectURL(blob);
      snapshotUrlRef.current = url;
      setSnapshot({ blob, url });
      // Nothing else to show from the camera while reviewing the shot.
      stopCamera();
    } catch {
      setCaptureError('We couldn’t take the photo. Please try again.');
    }
  };

  const handleRetake = () => {
    clearSnapshot();
    void startCamera();
  };

  const handleUse = () => {
    if (!snapshot) return;
    onCapture(
      new File([snapshot.blob], `${fileNamePrefix}-${Date.now()}.jpg`, { type: 'image/jpeg' }),
    );
  };

  const errorMessage = (cameraStatus === 'error' ? cameraError : null) ?? captureError;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: let React unmount us instead of the browser closing the dialog on its own.
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-black p-0 text-white backdrop:bg-black/70 md:m-auto md:h-auto md:max-h-[92dvh] md:max-w-xl md:rounded-card"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-white/10"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-black md:aspect-[4/3] md:flex-none">
          {snapshot ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL, nothing to optimise
            <img
              src={snapshot.url}
              alt={`Photo of the ${title.toLowerCase()}`}
              className="absolute inset-0 size-full object-contain"
            />
          ) : (
            <>
              {cameraStatus === 'active' && (
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  autoPlay
                  aria-label="Camera preview"
                  className="absolute inset-0 size-full object-contain"
                />
              )}
              {cameraStatus === 'requesting' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner label="Starting camera" className="[&_svg]:size-8" />
                </div>
              )}
              {cameraStatus === 'active' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                  <div
                    className="w-full max-w-[88%] rounded-tile border-2 border-white/90 shadow-[0_0_0_100vmax_rgb(0_0_0/0.45)]"
                    style={{ aspectRatio: guideAspect }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 pt-4 pb-6 text-center">
          <p aria-live="polite" className="mx-auto max-w-sm text-sm leading-5 text-white/85">
            {errorMessage ??
              (snapshot
                ? 'Check that all four corners are visible and the text is sharp.'
                : guideText)}
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            {snapshot ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleRetake}
                  className="border-white text-white hover:bg-white/10"
                >
                  Retake
                </Button>
                <Button variant="mint" onClick={handleUse} className="rounded-pill">
                  Use photo
                </Button>
              </>
            ) : cameraStatus === 'error' ? (
              <>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="border-white text-white hover:bg-white/10"
                >
                  Upload a file instead
                </Button>
                <Button variant="mint" onClick={() => void startCamera()} className="rounded-pill">
                  Try again
                </Button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void handleShutter()}
                disabled={cameraStatus !== 'active'}
                aria-label="Take photo"
                className="size-16 rounded-full border-4 border-white bg-white/85 ring-4 ring-white/25 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              />
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
