import React, { useState, useRef } from 'react';
import { UploadCloud, File, FileText, Music, Image as ImageIcon, X, ArrowRight } from 'lucide-react';
import { NoteSourceType } from '../types/note';

interface FileDropzoneProps {
  onFileReady: (base64Data: string, mimeType: string, filename: string, sourceType: NoteSourceType) => void;
  isProcessing: boolean;
  acceptedCategory?: 'all' | 'pdf' | 'image' | 'audio';
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileReady,
  isProcessing,
  acceptedCategory = 'all'
}) => {
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<NoteSourceType>('pdf');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = (file: File) => {
    setErrorMsg(null);

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File exceeds 25MB limit. Please upload a smaller document or media clip.');
      return;
    }

    let resolvedType: NoteSourceType = 'pdf';
    if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|webm|ogg|aac)$/i.test(file.name)) {
      resolvedType = 'audio';
    } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name)) {
      resolvedType = 'handwritten';
    } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      resolvedType = 'pdf';
    } else {
      setErrorMsg('Unsupported format. Please upload a PDF, image (JPG/PNG), or audio file (MP3/WAV/WebM).');
      return;
    }

    setSelectedFile(file);
    setDetectedType(resolvedType);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Read base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setFileBase64(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProceed = () => {
    if (!selectedFile || !fileBase64) return;
    onFileReady(fileBase64, selectedFile.type || 'application/octet-stream', selectedFile.name, detectedType);
  };

  const getAcceptAttribute = () => {
    if (acceptedCategory === 'pdf') return '.pdf,application/pdf';
    if (acceptedCategory === 'image') return 'image/*';
    if (acceptedCategory === 'audio') return 'audio/*,.mp3,.wav,.m4a,.webm';
    return '.pdf,application/pdf,image/*,audio/*,.mp3,.wav,.m4a,.webm';
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptAttribute()}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />

          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-sm font-semibold text-slate-800">
            Click to upload or drag & drop files here
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports PDF documents, handwritten note photos (JPG/PNG), and audio recordings (MP3/WAV/WebM)
          </p>
          <div className="mt-3 inline-flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <File className="w-3.5 h-3.5" /> PDF
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Photos / Scans
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Music className="w-3.5 h-3.5" /> Audio Memos
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                {detectedType === 'pdf' && <FileText className="w-5 h-5 text-indigo-600" />}
                {detectedType === 'handwritten' && <ImageIcon className="w-5 h-5 text-amber-600" />}
                {detectedType === 'audio' && <Music className="w-5 h-5 text-blue-600" />}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono tabular-nums">{formatFileSize(selectedFile.size)}</span>
                  <span>·</span>
                  <span className="capitalize font-medium text-slate-700">
                    {detectedType === 'handwritten' ? 'Handwritten Image (OCR)' : detectedType === 'audio' ? 'Audio Memo' : 'PDF Document'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={clearSelection}
              disabled={isProcessing}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {previewUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 max-h-48 flex items-center justify-center bg-slate-900">
              <img
                src={previewUrl}
                alt="Selected preview"
                className="max-h-48 object-contain"
              />
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={clearSelection}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Choose Different File
            </button>
            <button
              onClick={handleProceed}
              disabled={isProcessing || !fileBase64}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <span>Analyze with Gemini AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
