// getUserMedia lifecycle for the liveness and ID cameras (start, stop, capture frame).
// The stream is always stopped on unmount (rules.md §12).
import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error';

/** 'user' = front (selfie) camera; 'environment' = back camera, preferred for photographing documents. */
export type CameraFacing = 'user' | 'environment';

// A plain facingMode string is a preference, so laptops without a back camera still get their webcam.
const CONSTRAINTS: Record<CameraFacing, MediaTrackConstraints> = {
  user: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
  // Higher resolution so the text on an ID card stays readable.
  environment: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
};

function describeCameraError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access is blocked. Allow camera access in your browser settings, then try again.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'We couldn’t find a camera on this device. Try another device with a front camera.';
    case 'NotReadableError':
      return 'Your camera is being used by another app. Close it, then try again.';
    default:
      return 'We couldn’t start your camera. Please try again.';
  }
}

export function useCamera({ facing = 'user' }: { facing?: CameraFacing } = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  // Bumped by every start/stop/unmount: a getUserMedia call that resolves after a newer request
  // (or after unmount, e.g. React StrictMode's double mount) stops its own stream immediately.
  const requestIdRef = useRef(0);

  const releaseStream = useCallback(() => {
    requestIdRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stop = useCallback(() => {
    releaseStream();
    setStatus('idle');
  }, [releaseStream]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'This browser can’t use a camera. Try a recent version of Chrome, Safari or Firefox.',
      );
      setStatus('error');
      return;
    }

    releaseStream();
    const requestId = requestIdRef.current;
    setError(null);
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: CONSTRAINTS[facing],
        audio: false,
      });
      if (requestId !== requestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setStatus('active');
    } catch (cameraError) {
      if (requestId !== requestIdRef.current) return;
      releaseStream();
      setError(describeCameraError(cameraError));
      setStatus('error');
    }
  }, [facing, releaseStream]);

  // The <video> only mounts once the status is active, so attach the stream afterwards.
  useEffect(() => {
    const video = videoRef.current;
    if (status !== 'active' || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => {
      // Autoplay can be refused; the muted inline video normally plays anyway.
    });
  }, [status]);

  useEffect(() => releaseStream, [releaseStream]);

  /** Grabs the current frame as a JPEG. Mirrors nothing: the server gets the real image. */
  const captureFrame = useCallback(async (): Promise<Blob> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) throw new Error('Camera is not ready');

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not capture a photo'))),
        'image/jpeg',
        0.9,
      );
    });
  }, []);

  return { videoRef, status, error, start, stop, captureFrame };
}
