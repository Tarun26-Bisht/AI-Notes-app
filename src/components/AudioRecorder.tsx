import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, ArrowRight, Volume2 } from 'lucide-react';

interface AudioRecorderProps {
  onAudioReady: (base64Data: string, mimeType: string, filename: string) => void;
  isProcessing: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady, isProcessing }) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');
  const [audioPlaybackState, setAudioPlaybackState] = useState<'playing' | 'paused'>('paused');
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = 4;
    const barGap = 2;
    const totalBars = Math.floor(canvas.width / (barWidth + barGap));
    const step = Math.floor(bufferLength / totalBars);

    for (let i = 0; i < totalBars; i++) {
      const value = dataArray[i * step] || 0;
      const percent = value / 255;
      const barHeight = Math.max(4, percent * (canvas.height - 8));
      const x = i * (barWidth + barGap);
      const y = (canvas.height - barHeight) / 2;

      ctx.fillStyle = recordingState === 'recording' ? '#2563EB' : '#94A3B8';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }

    if (recordingState === 'recording') {
      animationFrameRef.current = requestAnimationFrame(drawWaveform);
    }
  };

  const startRecording = async () => {
    setRecordingError(null);
    audioChunksRef.current = [];
    setAudioUrl(null);
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Audio visualizer setup
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Choose supported mimeType
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      setRecordedMimeType(mimeType);

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioUrl(url);

        // Stop mic tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start(250); // Emit chunks every 250ms
      setRecordingState('recording');
      setElapsedSeconds(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // Start waveform loop
      drawWaveform();
    } catch {
      setRecordingError('Microphone permission denied or no audio device detected. You can also upload an audio recording file directly.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      drawWaveform();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const resetRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setRecordingState('idle');
    setElapsedSeconds(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingError(null);
  };

  const togglePreviewPlayback = () => {
    if (!audioPreviewRef.current) return;
    if (audioPlaybackState === 'playing') {
      audioPreviewRef.current.pause();
      setAudioPlaybackState('paused');
    } else {
      audioPreviewRef.current.play();
      setAudioPlaybackState('playing');
    }
  };

  const handleConfirmAndProcess = () => {
    if (!audioBlob) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const filename = `voice-memo-${new Date().toISOString().substring(0, 19).replace(/:/g, '-')}.webm`;
      onAudioReady(base64, recordedMimeType, filename);
    };
    reader.readAsDataURL(audioBlob);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      {recordingError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {recordingError}
        </div>
      )}

      {/* Visualizer Canvas & Status */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={360}
          height={60}
          className="w-full max-w-sm h-16 rounded bg-slate-50 border border-slate-100"
        />

        <div className="mt-3 flex items-center justify-between w-full max-w-sm text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                recordingState === 'recording'
                  ? 'bg-red-500 animate-pulse'
                  : recordingState === 'paused'
                  ? 'bg-amber-500'
                  : recordingState === 'stopped'
                  ? 'bg-emerald-500'
                  : 'bg-slate-300'
              }`}
            />
            <span className="font-medium text-slate-700 capitalize">
              {recordingState === 'idle'
                ? 'Ready to record'
                : recordingState === 'recording'
                ? 'Recording in progress...'
                : recordingState === 'paused'
                ? 'Recording paused'
                : 'Recording completed'}
            </span>
          </div>
          <span className="font-mono tabular-nums text-sm font-semibold text-slate-900">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {recordingState === 'idle' && (
          <>
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Mic className="w-4 h-4" />
              <span>Start Voice Recording</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-2xs transition-colors cursor-pointer">
              <span>Upload Audio File</span>
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                className="hidden"
                disabled={isProcessing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64 = reader.result as string;
                    onAudioReady(base64, file.type || 'audio/webm', file.name);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </>
        )}

        {(recordingState === 'recording' || recordingState === 'paused') && (
          <>
            {recordingState === 'recording' ? (
              <button
                onClick={pauseRecording}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-medium rounded-lg transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-medium rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
            )}

            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Finish Recording</span>
            </button>
          </>
        )}

        {recordingState === 'stopped' && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={resetRecording}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard & Retake</span>
              </button>

              {audioUrl && (
                <button
                  onClick={togglePreviewPlayback}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition-colors"
                >
                  {audioPlaybackState === 'playing' ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Preview</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen Preview</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              onClick={handleConfirmAndProcess}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <span>Transcribe & Summarize</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {audioUrl && (
        <audio
          ref={audioPreviewRef}
          src={audioUrl}
          onEnded={() => setAudioPlaybackState('paused')}
          className="hidden"
        />
      )}
    </div>
  );
};
