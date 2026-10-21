// getUserMedia lifecycle for the liveness camera (start, stop, capture frame).
// The stream is always stopped on unmount (rules.md §12).
import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error';

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

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const releaseStream = useCallback(() => {
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

    setError(null);
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setStatus('active');
    } catch (cameraError) {
      releaseStream();
      setError(describeCameraError(cameraError));
      setStatus('error');
    }
  }, [releaseStream]);

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
