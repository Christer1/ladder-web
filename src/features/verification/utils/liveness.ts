// Pure liveness-check session: environment checks + random challenges (blink, smile, turn left/right).
// No DOM or MediaPipe here: the hook turns each video frame into a FrameAnalysis and calls update().
//
// This is a UX gate that guides the user and proves they followed live instructions on-device.
// It is NOT the security decision: the backend / liveness provider must still verify the selfie.

export type LivenessChallenge = 'blink' | 'smile' | 'turnLeft' | 'turnRight';

export const ALL_CHALLENGES: readonly LivenessChallenge[] = [
  'blink',
  'smile',
  'turnLeft',
  'turnRight',
];

/** How many random challenges each attempt asks for. */
export const CHALLENGE_COUNT = 3;

export type GuidanceIssue =
  'too_dark' | 'too_bright' | 'no_face' | 'multiple_faces' | 'too_far' | 'too_close' | 'off_centre';

/** One analysed video frame. Brightness is sampled less often than faces, so it may be null. */
export type FrameAnalysis = {
  /** Average luma 0–255 of the frame, or null when not measured on this frame. */
  brightness: number | null;
  faceCount: number;
  face: {
    /** 0 (open) – 1 (closed), averaged over both eyes. */
    blink: number;
    /** 0 – 1, averaged over both mouth corners. */
    smile: number;
    /** Head turn, about −1 … 1. Positive = towards the user's own left. */
    yaw: number;
    /** Face width relative to the visible (oval) frame width. */
    size: number;
    /** Distance of the face centre from the frame centre, in visible-frame units. */
    offsetX: number;
    offsetY: number;
  } | null;
};

export type LivenessPhase = 'positioning' | 'challenge' | 'returnToCentre' | 'done' | 'timedOut';

export type LivenessState = {
  phase: LivenessPhase;
  challenges: readonly LivenessChallenge[];
  /** Index of the current challenge (equals challenges.length once all are done). */
  currentIndex: number;
  /** 0 – 1 for the whole check; drives the progress ring. */
  progress: number;
  /** Environment/framing problem to show instead of the instruction, if any. */
  issue: GuidanceIssue | null;
};

export const LIVENESS_THRESHOLDS = {
  minBrightness: 60,
  maxBrightness: 205,
  minFaceSize: 0.32,
  maxFaceSize: 0.85,
  maxOffset: 0.22,
  eyesClosed: 0.5,
  eyesOpen: 0.25,
  smiling: 0.55,
  neutralSmile: 0.3,
  turned: 0.3,
  neutralYaw: 0.14,
  /** How long a pose must be held to count, in ms. */
  holdMs: 350,
  /** Neutral pose hold before the first challenge and between challenges. */
  neutralHoldMs: 400,
  /** A blink must re-open within this time after closing. */
  blinkWindowMs: 1500,
  /** Problems must persist this long before they are shown (avoids flicker). */
  issueDebounceMs: 400,
  /** Active (problem-free) time allowed per challenge before the attempt fails. */
  challengeTimeoutMs: 12_000,
} as const;

/** Fisher–Yates pick of `count` distinct challenges in random order. */
export function pickChallenges(
  count: number = CHALLENGE_COUNT,
  random: () => number = Math.random,
): LivenessChallenge[] {
  const pool = [...ALL_CHALLENGES];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

function detectIssue(
  frame: FrameAnalysis,
  brightness: number | null,
  t: typeof LIVENESS_THRESHOLDS,
): GuidanceIssue | null {
  if (brightness !== null && brightness < t.minBrightness) return 'too_dark';
  if (brightness !== null && brightness > t.maxBrightness) return 'too_bright';
  if (frame.faceCount === 0 || !frame.face) return 'no_face';
  if (frame.faceCount > 1) return 'multiple_faces';
  if (frame.face.size < t.minFaceSize) return 'too_far';
  if (frame.face.size > t.maxFaceSize) return 'too_close';
  // Head turns move the face centre a little, so only flag clearly off-centre faces.
  if (Math.abs(frame.face.offsetX) > t.maxOffset || Math.abs(frame.face.offsetY) > t.maxOffset) {
    return 'off_centre';
  }
  return null;
}

function isNeutral(face: NonNullable<FrameAnalysis['face']>, t: typeof LIVENESS_THRESHOLDS) {
  return (
    Math.abs(face.yaw) < t.neutralYaw && face.smile < t.neutralSmile && face.blink < t.eyesClosed
  );
}

/**
 * Creates a session for one attempt. Call update() for every analysed frame with a
 * monotonically increasing timestamp (ms); it returns the state to render.
 */
export function createLivenessSession(
  challenges: readonly LivenessChallenge[],
  thresholds: typeof LIVENESS_THRESHOLDS = LIVENESS_THRESHOLDS,
) {
  const t = thresholds;
  const total = challenges.length;

  let phase: LivenessPhase = 'positioning';
  let currentIndex = 0;
  let lastBrightness: number | null = null;

  // Issue debouncing.
  let reportedIssue: GuidanceIssue | null = null;
  let candidateIssue: GuidanceIssue | null = null;
  let candidateSince = 0;

  // Per-step tracking.
  let holdStart: number | null = null;
  let blinkClosedAt: number | null = null;
  let activeMs = 0;
  let lastNow: number | null = null;
  let stepProgress = 0;

  const resetStep = () => {
    holdStart = null;
    blinkClosedAt = null;
    activeMs = 0;
    stepProgress = 0;
  };

  const snapshot = (): LivenessState => {
    const completed = phase === 'done' ? total : currentIndex;
    // Challenges fill 95% of the ring; the final "look straight" fills the rest.
    const challengeShare = 0.95;
    const raw =
      phase === 'done'
        ? 1
        : (Math.min(completed, total) + (phase === 'challenge' ? stepProgress : 0)) / total;
    return {
      phase,
      challenges,
      currentIndex,
      progress: phase === 'done' ? 1 : Math.min(raw * challengeShare, challengeShare),
      issue: phase === 'done' || phase === 'timedOut' ? null : reportedIssue,
    };
  };

  /** Returns true once `condition` has held for `ms`. Updates stepProgress for hold-based steps. */
  const held = (condition: boolean, now: number, ms: number) => {
    if (!condition) {
      holdStart = null;
      return false;
    }
    holdStart ??= now;
    const fraction = Math.min((now - holdStart) / ms, 1);
    if (phase === 'challenge') stepProgress = Math.max(stepProgress, fraction * 0.9);
    return now - holdStart >= ms;
  };

  const completeChallenge = () => {
    currentIndex += 1;
    resetStep();
    phase = 'returnToCentre';
  };

  function update(frame: FrameAnalysis, now: number): LivenessState {
    if (phase === 'done' || phase === 'timedOut') return snapshot();

    if (frame.brightness !== null) lastBrightness = frame.brightness;
    const elapsed = lastNow === null ? 0 : Math.max(0, now - lastNow);
    lastNow = now;

    // Debounced environment / framing checks.
    const issue = detectIssue(frame, lastBrightness, t);
    if (issue !== candidateIssue) {
      candidateIssue = issue;
      candidateSince = now;
    }
    if (issue === null || now - candidateSince >= t.issueDebounceMs) reportedIssue = issue;

    // Any problem pauses the check: no progress, no timeout.
    if (issue !== null || !frame.face) {
      holdStart = null;
      blinkClosedAt = null;
      return snapshot();
    }
    const face = frame.face;

    if (phase === 'positioning' || phase === 'returnToCentre') {
      if (held(isNeutral(face, t), now, t.neutralHoldMs)) {
        holdStart = null;
        phase = currentIndex >= total ? 'done' : 'challenge';
      }
      return snapshot();
    }

    // phase === 'challenge'
    activeMs += elapsed;
    if (activeMs > t.challengeTimeoutMs) {
      phase = 'timedOut';
      return snapshot();
    }

    switch (challenges[currentIndex]) {
      case 'blink': {
        if (face.blink >= t.eyesClosed) {
          blinkClosedAt ??= now;
          stepProgress = Math.max(stepProgress, 0.5);
        } else if (blinkClosedAt !== null && face.blink <= t.eyesOpen) {
          if (now - blinkClosedAt <= t.blinkWindowMs) completeChallenge();
          else blinkClosedAt = null;
        }
        break;
      }
      case 'smile':
        if (held(face.smile >= t.smiling, now, t.holdMs)) completeChallenge();
        break;
      case 'turnLeft':
        if (held(face.yaw >= t.turned, now, t.holdMs)) completeChallenge();
        break;
      case 'turnRight':
        if (held(face.yaw <= -t.turned, now, t.holdMs)) completeChallenge();
        break;
    }
    return snapshot();
  }

  return { update, getState: snapshot };
}

export type LivenessSession = ReturnType<typeof createLivenessSession>;
