import React from 'react';
import { Sparkles, Plus, CheckSquare, FileText, Tags, Archive } from 'lucide-react';

interface TopNavBarProps {
  activeView: 'notes' | 'actions' | 'taxonomy' | 'archive';
  onViewChange: (view: 'notes' | 'actions' | 'taxonomy' | 'archive') => void;
  onOpenNewNote: () => void;
  pendingActionsCount: number;
  archivedCount: number;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeView,
  onViewChange,
  onOpenNewNote,
  pendingActionsCount,
  archivedCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
              SmartNotes AI
            </span>
            <span className="text-[11px] text-slate-500 font-normal block leading-none">
              MERN · Audio, PDF & Handwritten Hub
            </span>
          </div>
        </div>

        {/* Zone 2: Single-line nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => onViewChange('notes')}
            className={`flex items-center gap-2 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeView === 'notes'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>All Notes</span>
          </button>

          <button
            onClick={() => onViewChange('actions')}
            className={`flex items-center gap-2 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeView === 'actions'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Action Items</span>
            {pendingActionsCount > 0 && (
              <span className="ml-1 text-xs font-mono font-semibold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                {pendingActionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onViewChange('taxonomy')}
            className={`flex items-center gap-2 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeView === 'taxonomy'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tags className="w-4 h-4" />
            <span>Auto-Tags</span>
          </button>

          <button
            onClick={() => onViewChange('archive')}
            className={`flex items-center gap-2 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeView === 'archive'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
            {archivedCount > 0 && (
              <span className="ml-1 text-xs font-mono font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded">
                {archivedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenNewNote}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Smart Note</span>
          </button>
        </div>
      </div>
    </header>
  );
};
