// Oval frame: placeholder state, live camera state, "Verify Face" CTA.
//
// Flow: Verify Face → camera permission → live preview → 3-second "hold still" countdown →
// capture one frame → upload → /verified. A liveness provider SDK (rules.md §2, open question 3)
// will replace the single-frame capture; the screen states stay the same.
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/layout/BackButton';
import { Button, Spinner } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils/cn';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useCamera } from '../hooks/useCamera';
import { useSubmitLiveness } from '../hooks/useSubmitLiveness';

const COUNTDOWN_SECONDS = 3;

type Phase = 'idle' | 'positioning' | 'countdown' | 'submitting' | 'failed';

function FacePlaceholderIcon() {
  return (
    <svg width="84" height="86" viewBox="0 0 84 86" aria-hidden="true">
      <circle cx="42" cy="19" r="19" className="fill-black" />
      <rect x="0" y="48" width="84" height="38" rx="19" className="fill-black" />
    </svg>
  );
}

export function LivenessCamera() {
  const router = useRouter();
  const completeStep = useOnboardingStore((state) => state.completeStep);
  // Destructured so the React Compiler sees videoRef as the only ref.
  const {
    videoRef,
    status: cameraStatus,
    error: cameraErrorText,
    start: startCamera,
    stop: stopCamera,
    captureFrame,
  } = useCamera();
  const submitLiveness = useSubmitLiveness();
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [failure, setFailure] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => clearTimer, []);

  const fail = (message: string) => {
    clearTimer();
    stopCamera();
    setFailure(message);
    setPhase('failed');
  };

  const captureAndSubmit = async () => {
    setPhase('submitting');
    let selfie: Blob;
    try {
      selfie = await captureFrame();
    } catch {
      fail('We couldn’t take a photo. Please try again.');
      return;
    }
    stopCamera();

    submitLiveness.mutate(
      { selfie },
      {
        onSuccess: () => {
          completeStep('liveness');
          router.push(ROUTES.VERIFIED);
        },
        onError: (error) => fail(error.message),
      },
    );
  };

  // Starts once the video is actually showing frames (an event, not an effect).
  const startCountdown = () => {
    if (phase !== 'positioning') return;
    setPhase('countdown');
    setSecondsLeft(COUNTDOWN_SECONDS);
    let remaining = COUNTDOWN_SECONDS;
    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearTimer();
        void captureAndSubmit();
      }
    }, 1000);
  };

  const handleStart = async () => {
    setFailure(null);
    setPhase('positioning');
    await startCamera();
  };

  const isCameraVisible =
    cameraStatus === 'active' && (phase === 'positioning' || phase === 'countdown');
  const cameraError = cameraStatus === 'error' ? cameraErrorText : null;
  const errorMessage = cameraError ?? (phase === 'failed' ? failure : null);
  const showStartButton = phase === 'idle' || Boolean(errorMessage);

  const instruction = errorMessage
    ? null
    : phase === 'positioning'
      ? cameraStatus === 'requesting'
        ? 'Waiting for camera permission…'
        : 'Centre your face in the frame'
      : phase === 'countdown'
        ? `Hold still… ${secondsLeft}`
        : phase === 'submitting'
          ? 'Verifying your face…'
          : null;

  return (
    <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10">
      <div className="lg:mt-auto">
        <BackButton href={ROUTES.CREDENTIALS} />

        <div className="mt-6 text-center lg:mt-4">
          <h1 className="text-2xl leading-8 font-bold text-brand-900 lg:text-[28px] lg:leading-9">
            Liveness Check
          </h1>
          <p className="mx-auto mt-1 max-w-[230px] text-[15px] leading-5 text-text-muted">
            Position yourself within the frame and follow the instructions
          </p>
        </div>

        <div
          className={cn(
            'relative mx-auto mt-9 aspect-[268/386] w-full max-w-[268px] overflow-hidden rounded-[134px]',
            isCameraVisible || phase === 'submitting'
              ? 'border-2 border-brand-900 bg-surface'
              : 'bg-face-placeholder',
          )}
        >
          {/* Mounted only while the camera is in use; mirrored so it feels like a mirror. */}
          {cameraStatus === 'active' && (
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              onPlaying={startCountdown}
              aria-label="Your camera preview"
              className="absolute inset-0 size-full -scale-x-100 object-cover"
            />
          )}
          {!isCameraVisible && phase !== 'submitting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <FacePlaceholderIcon />
            </div>
          )}
          {phase === 'submitting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/80 text-brand-900">
              <Spinner className="[&_svg]:size-10" />
            </div>
          )}
        </div>

        <div aria-live="polite" className="mt-5 min-h-6 text-center">
          {instruction && (
            <p className="text-[15px] leading-6 font-medium text-brand-900">{instruction}</p>
          )}
          {errorMessage && (
            <p role="alert" className="text-sm text-danger">
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Pinned to the bottom on mobile (rules.md §6); hidden while the camera is running. */}
      <div className="mt-auto pt-6 lg:mt-6 lg:mb-auto">
        {showStartButton && (
          <Button onClick={() => void handleStart()}>
            {errorMessage ? 'Try again' : 'Verify Face'}
          </Button>
        )}
        {(phase === 'positioning' || phase === 'countdown') && !errorMessage && (
          <Button
            variant="secondary"
            onClick={() => {
              clearTimer();
              stopCamera();
              setPhase('idle');
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
