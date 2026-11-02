import { useCallback, useEffect, useRef, useState } from 'react';

/** Maps getUserMedia failures to clear, actionable messages. */
export const describeCameraError = (err) => {
  const name = err?.name || '';
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Live camera is not available here (it needs HTTPS or localhost). You can still take a photo with the button below or upload one.';
  }
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera permission was denied. Allow camera access in your browser settings, or upload a photo instead.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No camera was found on this device. Please upload a photo instead.';
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return 'The camera is busy or unavailable (another app may be using it). Close it and try again, or upload a photo.';
  }
  return 'Could not start the camera. Please try again or upload a photo.';
};

/**
 * Camera hook: start/stop stream, flip front/back, capture a JPEG blob (max 1280px).
 * Always releases tracks on stop/unmount.
 */
const useCamera = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
  }, []);

  const start = useCallback(
    async (mode) => {
      setError('');
      stop();
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(describeCameraError(null));
        return false;
      }
      setIsStarting(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setFacingMode(mode);
        setIsActive(true);
        return true;
      } catch (err) {
        setError(describeCameraError(err));
        return false;
      } finally {
        setIsStarting(false);
      }
    },
    [stop]
  );

  const flip = useCallback(() => start(facingMode === 'environment' ? 'user' : 'environment'), [facingMode, start]);

  const capture = useCallback(
    () =>
      new Promise((resolve, reject) => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) {
          reject(new Error('Camera is not ready yet. Please try again.'));
          return;
        }
        const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not capture the photo.'))), 'image/jpeg', 0.88);
      }),
    []
  );

  useEffect(() => stop, [stop]);

  return { videoRef, isActive, isStarting, error, facingMode, start, stop, flip, capture };
};

export default useCamera;
