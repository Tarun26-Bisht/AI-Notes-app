import React, { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, ArrowRight, VideoOff, UploadCloud, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureProps {
  onPhotoCaptured: (base64Data: string, mimeType: string, filename: string) => void;
  isProcessing: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoCaptured, isProcessing }) => {
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasCameraDevice, setHasCameraDevice] = useState<boolean | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if camera devices exist on the system
  useEffect(() => {
    let isMounted = true;

    async function checkCameraDevices() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          if (isMounted) setHasCameraDevice(false);
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');

        if (isMounted) {
          if (videoDevices.length > 0) {
            setHasCameraDevice(true);
            // Device found, attempt to initialize camera
            startCamera();
          } else {
            setHasCameraDevice(false);
            setStatusNotice('No physical camera device was detected on this system. You can upload a photo or scan of your handwritten notes below.');
          }
        }
      } catch {
        if (isMounted) {
          setHasCameraDevice(false);
          setStatusNotice('Camera detection unavailable. You can upload a photo or scan of your handwritten notes below.');
        }
      }
    }

    checkCameraDevices();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setStatusNotice(null);
    setCapturedImage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraDevice(false);
        setStatusNotice('Camera API is not supported in this browser environment.');
        return;
      }

      let stream: MediaStream;
      try {
        // Try rear/environment camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
      } catch {
        // Fallback to any default camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setStreamActive(true);
      setHasCameraDevice(true);
    } catch {
      // Gracefully handle without console.error
      setStreamActive(false);
      setHasCameraDevice(false);
      setStatusNotice('No active camera device found or permission was not granted. You can upload an image file instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    stopCamera();
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmAndSubmit = () => {
    if (!capturedImage) return;
    const filename = `handwritten-scan-${new Date().toISOString().substring(0, 19).replace(/:/g, '-')}.jpg`;
    onPhotoCaptured(capturedImage, 'image/jpeg', filename);
  };

  const handleImageFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      {statusNotice && (
        <div className="mb-4 p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
          <VideoOff className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="flex-1">
            <span className="font-medium">{statusNotice}</span>
          </div>
        </div>
      )}

      {/* Viewfinder / Preview Container */}
      <div className="relative aspect-video w-full max-w-lg mx-auto bg-slate-900 rounded-lg overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center">
        {!capturedImage ? (
          streamActive ? (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 border border-dashed border-white/40 pointer-events-none rounded flex items-end justify-center pb-2">
                <span className="text-[11px] text-white/80 bg-black/60 px-2.5 py-1 rounded backdrop-blur-xs font-sans">
                  Align handwritten note or whiteboard inside frame
                </span>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 mb-2 text-slate-500 opacity-60" />
              <p className="text-xs text-slate-300 font-medium">
                {hasCameraDevice === false ? 'No live camera detected' : 'Camera viewfinder ready'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Snap a photo with a connected webcam, or choose an image file of your handwritten notes.
              </p>
            </div>
          )
        ) : (
          <img
            src={capturedImage}
            alt="Captured handwritten note"
            className="w-full h-full object-contain bg-black"
          />
        )}
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for direct photo capture / file selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageFilePicked}
        className="hidden"
      />

      {/* Controls Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {!capturedImage ? (
          <>
            {streamActive ? (
              <button
                onClick={takeSnapshot}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Snapshot</span>
              </button>
            ) : (
              hasCameraDevice && (
                <button
                  onClick={startCamera}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Live Camera</span>
                </button>
              )
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-2xs transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Choose Photo or Scan</span>
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between gap-3">
            <button
              onClick={retake}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake / Choose Another</span>
            </button>

            <button
              onClick={confirmAndSubmit}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <span>Digitize & OCR Analyze</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
