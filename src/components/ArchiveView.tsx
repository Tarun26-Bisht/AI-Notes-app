import React, { useState, useEffect, useCallback } from 'react';
import { SmartNote } from '../types/note';
import { NoteCard } from './NoteCard';
import { Archive, Search, RotateCcw, X, FileQuestion, RefreshCw } from 'lucide-react';

interface ArchiveViewProps {
  onSelectNote: (note: SmartNote) => void;
  onRestoreNote: (noteId: string) => void;
  onDeletePermanently: (noteId: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  onSelectNote,
  onRestoreNote,
  onDeletePermanently
}) => {
  const [archivedNotes, setArchivedNotes] = useState<SmartNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const loadArchivedNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('archived', 'true');
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);

      const res = await fetch(`/api/notes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setArchivedNotes(data);
      }
    } catch (err) {
      console.error('Error loading archived notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    loadArchivedNotes();
  }, [loadArchivedNotes]);

  return (
    <div className="space-y-6">
      {/* Archive Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Archive className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Notes Archive Hub</h2>
            <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
              {archivedNotes.length} {archivedNotes.length === 1 ? 'archived note' : 'archived notes'}
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Inactive, concluded, or reference notes are stored here safely away from your active workspace.
            Transcripts, executive summaries, and action item records are fully preserved and can be restored back anytime.
          </p>
        </div>

        <button
          onClick={loadArchivedNotes}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'All Archived' },
            { id: 'audio', label: 'Audio' },
            { id: 'handwritten', label: 'Handwritten' },
            { id: 'pdf', label: 'PDFs' },
            { id: 'text', label: 'Text' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTypeFilter(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                typeFilter === item.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archived notes..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-5 h-52 animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-full mb-1" />
              <div className="h-3 bg-slate-100 rounded w-4/5 mb-4" />
            </div>
          ))}
        </div>
      ) : archivedNotes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            {searchQuery || typeFilter !== 'all' ? 'No matching archived notes' : 'Your archive is empty'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your search keywords or category filters.'
              : 'Move inactive, completed, or reference notes here to keep your active workspace organized and clutter-free.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {archivedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => onSelectNote(note)}
              onArchive={() => onRestoreNote(note.id)}
              onDelete={(e) => {
                e.stopPropagation();
                if (confirm(`Permanently delete "${note.title}"? This cannot be undone.`)) {
                  onDeletePermanently(note.id);
                  setArchivedNotes((prev) => prev.filter((n) => n.id !== note.id));
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
