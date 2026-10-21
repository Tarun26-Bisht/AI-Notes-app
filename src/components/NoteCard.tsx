import React from 'react';
import { SmartNote } from '../types/note';
import { Mic, FileText, Edit3, File, CheckSquare, Trash2, ArrowUpRight, Archive, RotateCcw, GraduationCap } from 'lucide-react';

interface NoteCardProps {
  note: SmartNote;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onArchive?: (e: React.MouseEvent) => void;
  onTagClick?: (tag: string, e: React.MouseEvent) => void;
  onStartQuiz?: (note: SmartNote, e: React.MouseEvent) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onClick,
  onDelete,
  onArchive,
  onTagClick,
  onStartQuiz
}) => {
  const getSourceIcon = () => {
    switch (note.sourceType) {
      case 'audio':
        return <Mic className="w-3.5 h-3.5 text-blue-600" />;
      case 'handwritten':
        return <Edit3 className="w-3.5 h-3.5 text-amber-600" />;
      case 'pdf':
        return <File className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getSourceLabel = () => {
    switch (note.sourceType) {
      case 'audio':
        return 'Voice Recording';
      case 'handwritten':
        return 'Handwritten / OCR';
      case 'pdf':
        return 'PDF Document';
      default:
        return 'Text Note';
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const completedCount = note.actionItems.filter((a) => a.completed).length;
  const totalActions = note.actionItems.length;

  return (
    <article
      onClick={onClick}
      className={`group relative bg-white border rounded-xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
        note.isArchived ? 'border-slate-300 bg-slate-50/50 opacity-90' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        {/* Unboxed Metadata Header (Zero-Pill Discipline) */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
          <div className="flex items-center gap-1.5 font-medium min-w-0">
            {getSourceIcon()}
            <span className="text-slate-700 truncate">{getSourceLabel()}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="shrink-0">{formatDate(note.createdAt)}</span>
            {note.isArchived && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-amber-700 font-semibold">Archived</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(e);
                }}
                title={note.isArchived ? 'Restore note to workspace' : 'Move note to archive'}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
              >
                {note.isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={onDelete}
              title="Delete note permanently"
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Note Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
          {note.title}
        </h3>

        {/* Executive Summary Excerpt */}
        <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
          {note.executiveSummary.replace(/[•*]/g, '').trim()}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
        {/* Auto-tags: Quiet unboxed typography */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            {note.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag, e);
                }}
                className="hover:text-blue-600 hover:underline transition-colors"
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > 4 && (
              <span className="text-[11px] text-slate-400">+{note.tags.length - 4} more</span>
            )}
          </div>
        )}

        {/* Footer info: Action Items & Read prompt */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            {totalActions > 0 ? (
              <span className="flex items-center gap-1 font-mono tabular-nums text-slate-700">
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {completedCount}/{totalActions}
                </span>
              </span>
            ) : (
              <span className="text-slate-400">0 tasks</span>
            )}

            {note.quiz && note.quiz.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartQuiz?.(note, e);
                }}
                title="Practice Exam MCQs for this note"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3 h-3 text-purple-600" />
                <span>{note.quiz.length} MCQs</span>
              </button>
            ) : note.sourceType === 'pdf' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartQuiz?.(note, e);
                }}
                title="Generate Exam MCQs for this PDF"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3 h-3 text-purple-600" />
                <span>Quiz</span>
              </button>
            ) : null}
          </div>

          <span className="inline-flex items-center gap-0.5 text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
            <span>{note.isArchived ? 'View' : 'Open'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
