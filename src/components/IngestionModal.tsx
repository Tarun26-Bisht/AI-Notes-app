import React, { useState } from 'react';
import { X, Mic, Camera, UploadCloud, Edit3, Loader2, Sparkles, Check } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { CameraCapture } from './CameraCapture';
import { FileDropzone } from './FileDropzone';
import { NoteSourceType, SmartNote } from '../types/note';

interface IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteCreated: (note: SmartNote) => void;
  authToken?: string | null;
}

export const IngestionModal: React.FC<IngestionModalProps> = ({ isOpen, onClose, onNoteCreated, authToken }) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'camera' | 'upload' | 'text'>('audio');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual text state
  const [textInput, setTextInput] = useState<string>('');

  if (!isOpen) return null;

  const handleProcessPayload = async (payload: {
    sourceType: NoteSourceType;
    fileBase64?: string;
    mimeType?: string;
    fileName?: string;
    textContent?: string;
  }) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setProcessStep('Connecting to Gemini 3.8 Flash Multimodal engine...');

    try {
      if (payload.sourceType === 'audio') {
        setProcessStep('Transcribing lecture speech & synthesizing study notes...');
      } else if (payload.sourceType === 'handwritten') {
        setProcessStep('Performing handwriting OCR & structuring diagram explanations...');
      } else if (payload.sourceType === 'pdf') {
        setProcessStep('Deeply analyzing PDF & authoring comprehensive student study notes...');
      } else {
        setProcessStep('Analyzing content & structuring pedagogical revision guide...');
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/ai/process-note', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with HTTP ${res.status}`);
      }

      setProcessStep('Formatting glossaries, topic breakdowns, exam tips & practice quizzes...');
      const createdNote: SmartNote = await res.json();

      setProcessStep('Saved to persistent document store!');
      setTimeout(() => {
        setIsProcessing(false);
        onNoteCreated(createdNote);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Error processing note:', err);
      setIsProcessing(false);
      setErrorMsg(err?.message || 'Failed to process note with Gemini AI. Please try again.');
    }
  };

  const handleManualTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) {
      setErrorMsg('Please enter or paste your note text first.');
      return;
    }
    handleProcessPayload({
      sourceType: 'text',
      textContent: textInput
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Capture & Organize New Smart Note
              </h2>
              <p className="text-xs text-slate-500">
                Gemini 3.8 Flash automatically transcribes, summarizes, and tags your notes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Mode Selector Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('audio')}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'audio'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Memo (Mic)</span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'camera'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera (Handwritten OCR)</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload PDF / Media</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'text'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Raw Text</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start justify-between gap-2">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="absolute -inset-1 rounded-full border border-blue-400 border-t-transparent animate-spin" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                AI Knowledge Extraction in Progress
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                {processStep}
              </p>
              <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-full h-full bg-blue-600 animate-pulse rounded-full" />
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'audio' && (
                <div>
                  <p className="text-xs text-slate-500 mb-3">
                    Record meetings, memos, lectures, or interviews. Our backend feeds the audio to Gemini for verbatim transcription, bulleted summaries, action items, and topic tags.
                  </p>
                  <AudioRecorder
                    isProcessing={isProcessing}
                    onAudioReady={(base64, mimeType, filename) => {
                      handleProcessPayload({
                        sourceType: 'audio',
                        fileBase64: base64,
                        mimeType,
                        fileName: filename
                      });
                    }}
                  />
                </div>
              )}

              {activeTab === 'camera' && (
                <div>
                  <p className="text-xs text-slate-500 mb-3">
                    Point your camera at a notebook page, whiteboard, sticky note, or sketched diagram. Gemini extracts handwritten text and figures into structured digital notes.
                  </p>
                  <CameraCapture
                    isProcessing={isProcessing}
                    onPhotoCaptured={(base64, mimeType, filename) => {
                      handleProcessPayload({
                        sourceType: 'handwritten',
                        fileBase64: base64,
                        mimeType,
                        fileName: filename
                      });
                    }}
                  />
                </div>
              )}

              {activeTab === 'upload' && (
                <div>
                  <p className="text-xs text-slate-500 mb-3">
                    Drop your PDF research reports, handwritten note scans (PNG/JPG), or audio recordings (MP3/WAV). The backend processes them automatically.
                  </p>
                  <FileDropzone
                    isProcessing={isProcessing}
                    onFileReady={(base64, mimeType, filename, detectedType) => {
                      handleProcessPayload({
                        sourceType: detectedType,
                        fileBase64: base64,
                        mimeType,
                        fileName: filename
                      });
                    }}
                  />
                </div>
              )}

              {activeTab === 'text' && (
                <form onSubmit={handleManualTextSubmit}>
                  <p className="text-xs text-slate-500 mb-3">
                    Paste raw unformatted text, email threads, or scratchpad thoughts. Gemini will organize it with title, executive summary, next actions, and auto-tags.
                  </p>
                  <textarea
                    rows={8}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste unformatted meeting notes, sprint retros, or raw notes here..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
                  />
                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setTextInput('')}
                      className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={!textInput.trim() || isProcessing}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Synthesize with AI</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
