import React, { useState } from 'react';
import { SmartNote, ActionItem } from '../types/note';
import {
  X,
  Copy,
  Check,
  Download,
  Trash2,
  Mic,
  File,
  Edit3,
  FileText,
  Volume2,
  Plus,
  Sparkles,
  ExternalLink,
  Archive,
  RotateCcw,
  GraduationCap,
  BookOpen,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { StudyNotesViewer } from './StudyNotesViewer';

interface NoteDetailModalProps {
  note: SmartNote | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleActionItem: (noteId: string, actionId: string) => void;
  onUpdateNote: (noteId: string, updates: Partial<SmartNote>) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleArchive?: (noteId: string) => void;
  onRegenerateNote?: (noteId: string) => Promise<void>;
  onStartQuiz?: (note: SmartNote) => void;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  note,
  isOpen,
  onClose,
  onToggleActionItem,
  onUpdateNote,
  onDeleteNote,
  onToggleArchive,
  onRegenerateNote,
  onStartQuiz
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'media'>('summary');
  const [copied, setCopied] = useState<boolean>(false);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [titleDraft, setTitleDraft] = useState<string>('');
  const [newActionInput, setNewActionInput] = useState<string>('');

  if (!isOpen || !note) return null;

  const handleCopyMarkdown = () => {
    const md = `# ${note.title}
Date: ${new Date(note.createdAt).toLocaleDateString()}
Source: ${note.sourceType}
Tags: ${note.tags.join(', ')}

## Executive Summary
${note.executiveSummary}

## Action Items
${note.actionItems.map((a) => `- [${a.completed ? 'x' : ' '}] ${a.text} (${a.priority || 'normal'})`).join('\n')}

## Full Content / Transcript
${note.rawContent}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = `# ${note.title}
Date: ${new Date(note.createdAt).toLocaleDateString()}
Source: ${note.sourceType}
Tags: ${note.tags.join(', ')}

## Executive Summary
${note.executiveSummary}

## Action Items
${note.actionItems.map((a) => `- [${a.completed ? 'x' : ' '}] ${a.text}`).join('\n')}

## Full Content / Transcript
${note.rawContent}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (note.tags.includes(clean)) {
      setNewTagInput('');
      return;
    }
    const updatedTags = [...note.tags, clean];
    onUpdateNote(note.id, { tags: updatedTags });
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = note.tags.filter((t) => t !== tagToRemove);
    onUpdateNote(note.id, { tags: updatedTags });
  };

  const handleSaveTitle = () => {
    if (titleDraft.trim()) {
      onUpdateNote(note.id, { title: titleDraft.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionInput.trim()) return;
    const newItem: ActionItem = {
      id: `act_${Date.now()}`,
      text: newActionInput.trim(),
      completed: false,
      priority: 'medium'
    };
    onUpdateNote(note.id, { actionItems: [...note.actionItems, newItem] });
    setNewActionInput('');
  };

  const getSourceIcon = () => {
    switch (note.sourceType) {
      case 'audio':
        return <Mic className="w-4 h-4 text-blue-600" />;
      case 'handwritten':
        return <Edit3 className="w-4 h-4 text-amber-600" />;
      case 'pdf':
        return <File className="w-4 h-4 text-indigo-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 shrink-0 bg-slate-50/50">
          <div className="flex-1 min-w-0">
            {/* Metadata breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
              <span className="flex items-center gap-1 text-slate-700">
                {getSourceIcon()}
                <span className="capitalize">{note.sourceType} Note</span>
              </span>
              <span>·</span>
              <span>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {note.estimatedReadTime && (
                <>
                  <span>·</span>
                  <span>{note.estimatedReadTime}</span>
                </>
              )}
            </div>

            {/* Editable Title */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  className="w-full text-lg font-bold text-slate-900 px-2 py-1 border border-blue-500 rounded-md focus:outline-hidden"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {note.title}
                </h2>
                <button
                  onClick={() => {
                    setTitleDraft(note.title);
                    setIsEditingTitle(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded transition-opacity"
                  title="Rename title"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyMarkdown}
              title="Copy Note as Markdown"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onStartQuiz && (
              <button
                onClick={() => {
                  onStartQuiz(note);
                  onClose();
                }}
                title="Practice Exam Quiz for this note"
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Practice Exam Quiz</span>
                <span className="sm:hidden">Quiz</span>
                {note.quiz && note.quiz.length > 0 && (
                  <span className="bg-purple-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {note.quiz.length}
                  </span>
                )}
              </button>
            )}

            {onRegenerateNote && (
              <button
                onClick={async () => {
                  setIsRegenerating(true);
                  try {
                    await onRegenerateNote(note.id);
                  } finally {
                    setIsRegenerating(false);
                  }
                }}
                disabled={isRegenerating}
                title="Regenerate as Master Student Study Notes"
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isRegenerating ? 'Analyzing PDF...' : 'Regenerate Notes'}
                </span>
              </button>
            )}

            <button
              onClick={handleDownloadMarkdown}
              title="Download as Markdown"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {onToggleArchive && (
              <button
                onClick={() => {
                  onToggleArchive(note.id);
                  onClose();
                }}
                title={note.isArchived ? 'Restore note to workspace' : 'Archive note'}
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5"
              >
                {note.isArchived ? (
                  <>
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                    <span className="hidden sm:inline">Restore</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span className="hidden sm:inline">Archive</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this note?')) {
                  onDeleteNote(note.id);
                  onClose();
                }
              }}
              title="Delete Note permanently"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-6 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Study Notes & Revision Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'transcript'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Transcript / OCR Text</span>
          </button>

          {note.mediaData && (
            <button
              onClick={() => setActiveTab('media')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'media'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {note.sourceType === 'audio' ? <Volume2 className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>Original Media Artifact</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Audio playback banner if audio note */}
              {note.sourceType === 'audio' && note.mediaData && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-blue-900 block truncate">
                      {note.originalFileName || 'Recorded Voice Memo'}
                    </span>
                    <audio
                      controls
                      src={note.mediaData}
                      className="w-full h-8 mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Study Notes & Revision Guide Section */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase">
                      Student Study Guide & Structured Notes
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Powered by Gemini 3.8 Flash</span>
                </div>
                <StudyNotesViewer content={note.executiveSummary} />
              </section>

              {/* Action Items Section */}
              <section className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase">
                    Extracted Action Items ({note.actionItems.filter((a) => a.completed).length}/{note.actionItems.length} completed)
                  </h3>
                </div>

                {note.actionItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No action items extracted from this note.</p>
                ) : (
                  <div className="space-y-2">
                    {note.actionItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onToggleActionItem(note.id, item.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          item.completed
                            ? 'bg-slate-50/70 border-slate-200 text-slate-400 line-through'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => {}} // handled by parent div click
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs leading-relaxed flex-1">
                          {item.text}
                        </span>
                        {item.priority === 'high' && (
                          <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded shrink-0">
                            High Priority
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new action item form */}
                <form onSubmit={handleAddActionItem} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newActionInput}
                    onChange={(e) => setNewActionInput(e.target.value)}
                    placeholder="Add a new action item..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </section>

              {/* Taxonomy Tags Section */}
              <section className="bg-slate-50/50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold tracking-wide text-slate-600 uppercase">
                    Auto-Tags & Taxonomy
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md shadow-2xs"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-red-500"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <form onSubmit={handleAddTag} className="inline-flex items-center">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="+ Add tag..."
                      className="w-24 px-2 py-0.5 text-xs bg-transparent border-b border-slate-300 focus:outline-hidden focus:border-blue-500"
                    />
                  </form>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Verbatim {note.sourceType === 'audio' ? 'speech-to-text transcript' : 'handwritten OCR transcription'}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(note.rawContent);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied transcript' : 'Copy transcript'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-line font-mono">
                {note.rawContent || 'No raw transcript recorded.'}
              </div>
            </div>
          )}

          {activeTab === 'media' && note.mediaData && (
            <div className="space-y-4">
              {note.sourceType === 'handwritten' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center p-2">
                  <img
                    src={note.mediaData}
                    alt="Original handwritten note snapshot"
                    className="max-h-[60vh] object-contain rounded"
                  />
                </div>
              )}

              {note.sourceType === 'audio' && (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <Volume2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">
                    {note.originalFileName || 'Recorded Audio Memo'}
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    High-quality audio recording captured in-app
                  </p>
                  <audio
                    controls
                    src={note.mediaData}
                    className="w-full max-w-md"
                  />
                </div>
              )}

              {note.sourceType === 'pdf' && (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <File className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">{note.originalFileName || 'PDF Document'}</p>
                  <p className="text-xs text-slate-500 mt-1">Processed and indexed with Gemini 3.8 Flash</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
