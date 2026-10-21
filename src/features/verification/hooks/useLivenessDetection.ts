// Runs the on-device face check on the live <video>: MediaPipe Face Landmarker for the face
// (blink, smile, head turn, framing) + a tiny canvas sample for brightness, fed into the pure
// liveness session (utils/liveness.ts). Frames never leave the device here.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { FACE_LANDMARKER_MODEL_URL, MEDIAPIPE_WASM_URL } from '@/config/liveness';
import {
  createLivenessSession,
  pickChallenges,
  type FrameAnalysis,
  type LivenessChallenge,
  type LivenessState,
} from '../utils/liveness';

export type DetectionStatus = 'idle' | 'loading' | 'running' | 'error';

type StartOptions = {
  /** All challenges passed and the user is looking straight again: capture now. */
  onDone: (challenges: readonly LivenessChallenge[]) => void;
  onTimeout: () => void;
  onError: (message: string) => void;
};

/** Width / height of the oval frame on screen; the video is cropped to it with object-cover. */
const OVAL_ASPECT = 268 / 386;
const DETECT_INTERVAL_MS = 66; // ~15 fps is plenty and keeps phones cool
const BRIGHTNESS_INTERVAL_MS = 250;

// Face mesh landmark indices (MediaPipe canonical face model).
const NOSE_TIP = 1;
const CHEEK_A = 234;
const CHEEK_B = 454;

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

/** Loads the model once per page session; retries create no second copy. */
function loadFaceLandmarker(): Promise<FaceLandmarker> {
  landmarkerPromise ??= (async () => {
    const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
    const create = (delegate: 'GPU' | 'CPU') =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL_URL, delegate },
        runningMode: 'VIDEO',
        // Two, so a second person in the frame can be detected and flagged.
        numFaces: 2,
        outputFaceBlendshapes: true,
      });
    try {
      return await create('GPU');
    } catch {
      return create('CPU');
    }
  })().catch((error: unknown) => {
    landmarkerPromise = null;
    throw error;
  });
  return landmarkerPromise;
}

function measureBrightness(ctx: CanvasRenderingContext2D, video: HTMLVideoElement): number {
  const { width, height } = ctx.canvas;
  ctx.drawImage(video, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return total / (data.length / 4);
}

function blendshape(result: FaceLandmarkerResult, name: string): number {
  return result.faceBlendshapes[0]?.categories.find((c) => c.categoryName === name)?.score ?? 0;
}

function analyzeFrame(
  result: FaceLandmarkerResult,
  video: HTMLVideoElement,
  brightness: number | null,
): FrameAnalysis {
  const landmarks = result.faceLandmarks[0];
  if (!landmarks?.length) return { brightness, faceCount: 0, face: null };

  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const point of landmarks) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  // The on-screen oval shows a centred crop of the frame; measure against that crop.
  const visibleWidthPx = Math.min(video.videoWidth, video.videoHeight * OVAL_ASPECT);
  const size = ((maxX - minX) * video.videoWidth) / visibleWidthPx;
  const offsetX = (((minX + maxX) / 2 - 0.5) * video.videoWidth) / visibleWidthPx;
  const offsetY = (minY + maxY) / 2 - 0.5;

  // Nose position between the cheeks. Landmarks are in raw (un-mirrored) camera coordinates,
  // where the user's own left is the image's right, so a larger x means "turned to their left".
  const cheekLeftX = Math.min(landmarks[CHEEK_A].x, landmarks[CHEEK_B].x);
  const cheekRightX = Math.max(landmarks[CHEEK_A].x, landmarks[CHEEK_B].x);
  const noseRatio = (landmarks[NOSE_TIP].x - cheekLeftX) / Math.max(cheekRightX - cheekLeftX, 1e-6);
  const yaw = (noseRatio - 0.5) * 2;

  return {
    brightness,
    faceCount: result.faceLandmarks.length,
    face: {
      blink: (blendshape(result, 'eyeBlinkLeft') + blendshape(result, 'eyeBlinkRight')) / 2,
      smile: (blendshape(result, 'mouthSmileLeft') + blendshape(result, 'mouthSmileRight')) / 2,
      yaw,
      size,
      offsetX,
      offsetY,
    },
  };
}

export function useLivenessDetection(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<DetectionStatus>('idle');
  const [state, setState] = useState<LivenessState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const frameRef = useRef<number | null>(null);
  // Bumped on every start/stop so a stale loop or late model load exits quietly.
  const runIdRef = useRef(0);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  /** Starts a new attempt with freshly randomised challenges. Call once the video is playing. */
  const start = useCallback(
    async ({ onDone, onTimeout, onError }: StartOptions) => {
      stop();
      const runId = runIdRef.current;
      const session = createLivenessSession(pickChallenges());
      setState(session.getState());
      setError(null);
      setStatus('loading');

      let landmarker: FaceLandmarker;
      try {
        landmarker = await loadFaceLandmarker();
      } catch {
        if (runId !== runIdRef.current) return;
        const message = 'We couldn’t start the face check. Check your connection and try again.';
        setError(message);
        setStatus('error');
        onError(message);
        return;
      }
      if (runId !== runIdRef.current) return;
      setStatus('running');

      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 24;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      let lastDetectAt = 0;
      let lastBrightnessAt = -Infinity;
      let lastRenderedKey = '';

      const tick = () => {
        if (runId !== runIdRef.current) return;
        const video = videoRef.current;
        const now = performance.now();

        if (video && video.readyState >= 2 && now - lastDetectAt >= DETECT_INTERVAL_MS) {
          lastDetectAt = now;
          let brightness: number | null = null;
          if (ctx && now - lastBrightnessAt >= BRIGHTNESS_INTERVAL_MS) {
            lastBrightnessAt = now;
            brightness = measureBrightness(ctx, video);
          }

          let next: LivenessState;
          try {
            next = session.update(
              analyzeFrame(landmarker.detectForVideo(video, now), video, brightness),
              now,
            );
          } catch {
            const message = 'The face check stopped unexpectedly. Please try again.';
            setError(message);
            setStatus('error');
            frameRef.current = null;
            onError(message);
            return;
          }

          // Only re-render when something visible changed.
          const key = `${next.phase}|${next.currentIndex}|${next.issue}|${Math.round(next.progress * 60)}`;
          if (key !== lastRenderedKey) {
            lastRenderedKey = key;
            setState(next);
          }
          if (next.phase === 'done' || next.phase === 'timedOut') {
            frameRef.current = null;
            if (next.phase === 'done') onDone(next.challenges);
            else onTimeout();
            return;
          }
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    },
    [stop, videoRef],
  );

  const reset = useCallback(() => {
    stop();
    setStatus('idle');
    setState(null);
    setError(null);
  }, [stop]);

  return { status, state, error, start, stop, reset };
}
