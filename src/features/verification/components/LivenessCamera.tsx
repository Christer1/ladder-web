// Oval frame: placeholder state, live camera state, "Verify Face" CTA.
//
// Flow: Verify Face → camera permission → on-device face check (lighting + framing, then random
// challenges: blink / smile / turn left / turn right, with a progress ring around the frame) →
// capture one front-facing frame → upload → /verified. The on-device check guides the user;
// the backend / liveness provider still makes the real decision (rules.md §2, open question 3).
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/layout/BackButton';
import { Button, Spinner } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils/cn';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useCamera } from '../hooks/useCamera';
import { useLivenessDetection } from '../hooks/useLivenessDetection';
import { useSubmitLiveness } from '../hooks/useSubmitLiveness';
import type { GuidanceIssue, LivenessChallenge, LivenessState } from '../utils/liveness';
import { LivenessProgressRing } from './LivenessProgressRing';

type Phase = 'idle' | 'starting' | 'checking' | 'submitting' | 'failed';

const CHALLENGE_TEXT: Record<LivenessChallenge, string> = {
  blink: 'Blink your eyes',
  smile: 'Smile',
  turnLeft: 'Turn your head to the left',
  turnRight: 'Turn your head to the right',
};

const ISSUE_TEXT: Record<GuidanceIssue, string> = {
  too_dark: 'It’s too dark. Move somewhere brighter or face a light.',
  too_bright: 'Too much light. Move away from direct light or a bright window.',
  no_face: 'We can’t see your face. Look at the camera.',
  multiple_faces: 'Make sure only you are in the frame.',
  too_far: 'Move a little closer.',
  too_close: 'Move back a little.',
  off_centre: 'Centre your face in the frame.',
};

const TIMEOUT_MESSAGE =
  'We couldn’t confirm that movement in time. Try again; you’ll get new instructions.';

function FacePlaceholderIcon() {
  return (
    <svg width="84" height="86" viewBox="0 0 84 86" aria-hidden="true">
      <circle cx="42" cy="19" r="19" className="fill-black" />
      <rect x="0" y="48" width="84" height="38" rx="19" className="fill-black" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 2.5 20h19L12 3.5Z"
        className="stroke-danger"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 10v4.5M12 17.2v.3"
        className="stroke-danger"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Main line under the frame for the current check state. */
function describeCheck(state: LivenessState): string {
  switch (state.phase) {
    case 'positioning':
      return 'Centre your face in the frame and look straight ahead';
    case 'challenge':
      return CHALLENGE_TEXT[state.challenges[state.currentIndex]];
    case 'returnToCentre':
      return state.currentIndex >= state.challenges.length
        ? 'Great. Now look straight at the camera'
        : 'Good. Now look straight at the camera';
    case 'done':
      return 'All done';
    case 'timedOut':
      return '';
  }
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
  const {
    status: detectionStatus,
    state: check,
    start: startDetection,
    stop: stopDetection,
    reset: resetDetection,
  } = useLivenessDetection(videoRef);
  const submitLiveness = useSubmitLiveness();
  const [phase, setPhase] = useState<Phase>('idle');
  const [failure, setFailure] = useState<string | null>(null);

  const fail = (message: string) => {
    stopDetection();
    stopCamera();
    setFailure(message);
    setPhase('failed');
  };

  const captureAndSubmit = async (challenges: readonly LivenessChallenge[]) => {
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
      { selfie, challenges },
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
  const handleVideoPlaying = () => {
    if (phase !== 'starting') return;
    setPhase('checking');
    void startDetection({
      onDone: (challenges) => void captureAndSubmit(challenges),
      onTimeout: () => fail(TIMEOUT_MESSAGE),
      onError: fail,
    });
  };

  const handleStart = async () => {
    // A retry must never leave an earlier stream or loop running.
    stopCamera();
    setFailure(null);
    resetDetection();
    setPhase('starting');
    await startCamera();
  };

  const handleCancel = () => {
    stopDetection();
    stopCamera();
    resetDetection();
    setPhase('idle');
  };

  const isCameraLive = cameraStatus === 'active' && (phase === 'starting' || phase === 'checking');
  const cameraError = cameraStatus === 'error' ? cameraErrorText : null;
  const errorMessage = cameraError ?? (phase === 'failed' ? failure : null);
  const showStartButton = phase === 'idle' || Boolean(errorMessage);
  const isChecking = phase === 'checking' && detectionStatus === 'running' && check !== null;

  const total = check?.challenges.length ?? 0;
  const stepNumber = check ? Math.min(check.currentIndex + 1, total) : 0;
  const progress = phase === 'submitting' ? 1 : (check?.progress ?? 0);

  const statusLine = errorMessage
    ? null
    : phase === 'starting'
      ? cameraStatus === 'requesting'
        ? 'Waiting for camera permission…'
        : 'Starting camera…'
      : phase === 'checking' && detectionStatus !== 'running'
        ? 'Preparing the face check…'
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

        <div className="relative mx-auto mt-9 w-full max-w-[268px]">
          <div
            className={cn(
              'relative aspect-[268/386] w-full overflow-hidden rounded-[134px]',
              isCameraLive || phase === 'submitting'
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
                onPlaying={handleVideoPlaying}
                aria-label="Your camera preview"
                className="absolute inset-0 size-full -scale-x-100 object-cover"
              />
            )}
            {!isCameraLive && phase !== 'submitting' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <FacePlaceholderIcon />
              </div>
            )}
            {(phase === 'submitting' ||
              (phase === 'checking' && detectionStatus === 'loading')) && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/70 text-brand-900">
                <Spinner className="[&_svg]:size-10" />
              </div>
            )}
          </div>

          {(phase === 'checking' || phase === 'submitting') && (
            <LivenessProgressRing
              progress={progress}
              isComplete={phase === 'submitting' || check?.phase === 'done'}
              valueText={total ? `Step ${stepNumber} of ${total}` : 'Starting'}
              className="absolute -inset-2.5 size-[calc(100%+20px)]"
            />
          )}
        </div>

        <div aria-live="polite" className="mt-6 min-h-16 text-center">
          {isChecking && check.issue ? (
            <p className="mx-auto flex max-w-[300px] items-start justify-center gap-2 text-[15px] leading-6 font-semibold text-brand-900">
              <span className="mt-0.5">
                <WarningIcon />
              </span>
              {ISSUE_TEXT[check.issue]}
            </p>
          ) : isChecking ? (
            <>
              {check.phase === 'challenge' && (
                <p className="text-sm leading-5 text-text-muted">
                  Step {stepNumber} of {total}
                </p>
              )}
              <p className="mt-1 text-lg leading-7 font-semibold text-brand-900">
                {describeCheck(check)}
              </p>
            </>
          ) : statusLine ? (
            <p className="text-[15px] leading-6 font-medium text-brand-900">{statusLine}</p>
          ) : null}
          {errorMessage && (
            <p role="alert" className="mx-auto max-w-[300px] text-sm leading-5 text-danger">
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Pinned to the bottom on mobile (rules.md §6). */}
      <div className="mt-auto pt-6 lg:mt-6 lg:mb-auto">
        {showStartButton && (
          <Button onClick={() => void handleStart()}>
            {errorMessage ? 'Try again' : 'Verify Face'}
          </Button>
        )}
        {(phase === 'starting' || phase === 'checking') && !errorMessage && (
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
