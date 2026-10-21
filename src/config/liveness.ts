// On-device face check assets (MediaPipe Face Landmarker) and tuning for the liveness challenges.
//
// The WASM version must match the installed @mediapipe/tasks-vision version (package.json):
// bump both together. Self-hosting these files is recommended before production
// (rules.md §2, open question 9).
const MEDIAPIPE_VERSION = '1.1.0';

export const MEDIAPIPE_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;

export const FACE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
