import React from 'react';
import { WorkspaceStats } from '../types/note';
import { Mic, FileSpreadsheet, Edit3, CheckCircle2, ListTodo } from 'lucide-react';

interface StatsBarProps {
  stats: WorkspaceStats;
  onFilterType?: (type: string) => void;
  activeType?: string;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, onFilterType, activeType }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <button
        onClick={() => onFilterType?.('all')}
        className={`p-3 rounded-lg border text-left transition-all ${
          activeType === 'all'
            ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="text-xs text-slate-500 font-medium block">Total Saved Notes</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalNotes}
          </span>
          <span className="text-xs text-slate-400">knowledge items</span>
        </div>
      </button>

      <button
        onClick={() => onFilterType?.('audio')}
        className={`p-3 rounded-lg border text-left transition-all ${
          activeType === 'audio'
            ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Audio Recordings</span>
          <Mic className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.audioNotes}
          </span>
          <span className="text-xs text-slate-400">transcribed</span>
        </div>
      </button>

      <button
        onClick={() => onFilterType?.('handwritten')}
        className={`p-3 rounded-lg border text-left transition-all ${
          activeType === 'handwritten'
            ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Handwritten / OCR</span>
          <Edit3 className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.handwrittenNotes}
          </span>
          <span className="text-xs text-slate-400">digitized</span>
        </div>
      </button>

      <button
        onClick={() => onFilterType?.('pdf')}
        className={`p-3 rounded-lg border text-left transition-all ${
          activeType === 'pdf'
            ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>PDF Documents</span>
          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.pdfNotes}
          </span>
          <span className="text-xs text-slate-400">summarized</span>
        </div>
      </button>

      <div className="p-3 rounded-lg border bg-white border-slate-200 col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Action Items</span>
          <ListTodo className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.pendingActionItems}
          </span>
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {stats.completedActionItems} done
          </span>
        </div>
      </div>
    </div>
  );
};
