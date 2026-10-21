import React, { useState, useEffect, useCallback } from 'react';
import { SmartNote, WorkspaceStats, TagCount } from './types/note';
import { TopNavBar } from './components/TopNavBar';
import { StatsBar } from './components/StatsBar';
import { NoteCard } from './components/NoteCard';
import { IngestionModal } from './components/IngestionModal';
import { NoteDetailModal } from './components/NoteDetailModal';
import { ActionTrackerView } from './components/ActionTrackerView';
import { TaxonomyView } from './components/TaxonomyView';
import { ArchiveView } from './components/ArchiveView';
import {
  Search,
  Mic,
  Camera,
  UploadCloud,
  X,
  FileQuestion,
  RefreshCw,
  Plus
} from 'lucide-react';

export default function App() {
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [stats, setStats] = useState<WorkspaceStats>({
    totalNotes: 0,
    audioNotes: 0,
    handwrittenNotes: 0,
    pdfNotes: 0,
    textNotes: 0,
    archivedNotes: 0,
    totalActionItems: 0,
    completedActionItems: 0,
    pendingActionItems: 0
  });
  const [tags, setTags] = useState<TagCount[]>([]);

  // Navigation & View state
  const [activeView, setActiveView] = useState<'notes' | 'actions' | 'taxonomy' | 'archive'>('notes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Modals
  const [isIngestionOpen, setIsIngestionOpen] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<SmartNote | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);
      if (tagFilter) params.append('tag', tagFilter);
      // Active view only loads unarchived notes
      params.append('archived', 'false');

      const [notesRes, statsRes, tagsRes] = await Promise.all([
        fetch(`/api/notes?${params.toString()}`),
        fetch('/api/stats'),
        fetch('/api/tags')
      ]);

      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData);
      }
    } catch (err) {
      console.error('Error loading notes data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, typeFilter, tagFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActionItem = async (noteId: string, actionId: string) => {
    // Optimistic UI update
    setNotes((prevNotes) =>
      prevNotes.map((n) => {
        if (n.id !== noteId) return n;
        return {
          ...n,
          actionItems: n.actionItems.map((a) =>
            a.id === actionId ? { ...a, completed: !a.completed } : a
          )
        };
      })
    );

    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          actionItems: prev.actionItems.map((a) =>
            a.id === actionId ? { ...a, completed: !a.completed } : a
          )
        };
      });
    }

    try {
      const res = await fetch(`/api/notes/${noteId}/action-items/${actionId}/toggle`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to toggle on server');
      const updatedNote: SmartNote = await res.json();

      // Refresh stats
      fetch('/api/stats')
        .then((r) => r.json())
        .then((s) => setStats(s))
        .catch(() => {});

      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(updatedNote);
      }
    } catch (err) {
      console.error('Error toggling action item:', err);
      loadData();
    }
  };

  const handleToggleArchive = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}/archive`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to update archive status');
      const updatedNote: SmartNote = await res.json();

      showToast(
        updatedNote.isArchived
          ? 'Note moved to Archive'
          : 'Note restored to Workspace'
      );

      // Refresh notes, tags, and stats
      loadData();

      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(updatedNote);
      }
    } catch (err) {
      console.error('Error toggling archive:', err);
      showToast('Failed to update archive state');
    }
  };

  const handleUpdateNote = async (noteId: string, updates: Partial<SmartNote>) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update note');
      const updatedNote = await res.json();

      setNotes((prev) => prev.map((n) => (n.id === noteId ? updatedNote : n)));
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(updatedNote);
      }
      showToast('Note updated successfully');

      // Refresh tags and stats
      fetch('/api/tags').then((r) => r.json()).then(setTags).catch(() => {});
      fetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});
    } catch (err) {
      console.error('Error updating note:', err);
      showToast('Failed to update note');
    }
  };

  const handleRegenerateNote = async (noteId: string) => {
    try {
      showToast('Generating comprehensive student study notes with Gemini 3.8 Flash...');
      const res = await fetch(`/api/notes/${noteId}/regenerate`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to regenerate study notes');
      const updatedNote: SmartNote = await res.json();

      setNotes((prev) => prev.map((n) => (n.id === noteId ? updatedNote : n)));
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(updatedNote);
      }
      showToast('🎓 Master Student Study Guide generated successfully!');
      loadData();
    } catch (err) {
      console.error('Error regenerating note:', err);
      showToast('Failed to regenerate study notes');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete note');

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNote && selectedNote.id === noteId) {
        setIsDetailOpen(false);
        setSelectedNote(null);
      }
      showToast('Note deleted');
      loadData();
    } catch (err) {
      console.error('Error deleting note:', err);
      showToast('Failed to delete note');
    }
  };

  const handleNoteCreated = (newNote: SmartNote) => {
    setNotes((prev) => [newNote, ...prev]);
    showToast(`Note "${newNote.title}" created & auto-tagged!`);
    loadData();
    // Automatically open the newly processed note
    setSelectedNote(newNote);
    setIsDetailOpen(true);
  };

  const handleTagClick = (tag: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTagFilter(tag);
    setActiveView('notes');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <TopNavBar
        activeView={activeView}
        onViewChange={(v) => {
          setActiveView(v);
        }}
        onOpenNewNote={() => setIsIngestionOpen(true)}
        pendingActionsCount={stats.pendingActionItems}
        archivedCount={stats.archivedNotes || 0}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'notes' && (
          <div>
            {/* Top Stats Overview */}
            <StatsBar
              stats={stats}
              activeType={typeFilter}
              onFilterType={(t) => setTypeFilter(t)}
            />

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Type segmented filter buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
                {[
                  { id: 'all', label: 'All Notes' },
                  { id: 'audio', label: 'Audio Memos' },
                  { id: 'handwritten', label: 'Handwritten / OCR' },
                  { id: 'pdf', label: 'PDF Documents' },
                  { id: 'text', label: 'Text Notes' }
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

              {/* Search & Active Tag filter */}
              <div className="flex items-center gap-3">
                {tagFilter && (
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-md">
                    <span>Tag: #{tagFilter}</span>
                    <button
                      onClick={() => setTagFilter(null)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="relative flex-1 md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles, summaries, tags..."
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

                <button
                  onClick={loadData}
                  title="Refresh notes"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notes Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded-xl p-5 h-56 animate-pulse"
                  >
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-full mb-1" />
                    <div className="h-3 bg-slate-100 rounded w-4/5 mb-4" />
                    <div className="h-3 bg-slate-100 rounded w-1/4 mt-auto" />
                  </div>
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto">
                <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">
                  {searchQuery || tagFilter || typeFilter !== 'all'
                    ? 'No notes match your filters'
                    : 'No active smart notes found'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-6">
                  {searchQuery || tagFilter || typeFilter !== 'all'
                    ? 'Try clearing your search query or switching source filters.'
                    : 'Start by recording a voice memo, taking a camera photo of handwritten notes, or uploading a PDF document.'}
                </p>

                {searchQuery || tagFilter || typeFilter !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setTagFilter(null);
                      setTypeFilter('all');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setIsIngestionOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create First Note</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => {
                      setSelectedNote(note);
                      setIsDetailOpen(true);
                    }}
                    onArchive={() => handleToggleArchive(note.id)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${note.title}"?`)) {
                        handleDeleteNote(note.id);
                      }
                    }}
                    onTagClick={(tag, e) => handleTagClick(tag, e)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'actions' && (
          <ActionTrackerView
            notes={notes}
            onToggleAction={handleToggleActionItem}
            onSelectNote={(note) => {
              setSelectedNote(note);
              setIsDetailOpen(true);
            }}
          />
        )}

        {activeView === 'taxonomy' && (
          <TaxonomyView
            tags={tags}
            onSelectTag={(tag) => {
              setTagFilter(tag);
              setActiveView('notes');
            }}
          />
        )}

        {activeView === 'archive' && (
          <ArchiveView
            onSelectNote={(note) => {
              setSelectedNote(note);
              setIsDetailOpen(true);
            }}
            onRestoreNote={handleToggleArchive}
            onDeletePermanently={handleDeleteNote}
          />
        )}
      </main>

      {/* Ingestion Hub Modal */}
      <IngestionModal
        isOpen={isIngestionOpen}
        onClose={() => setIsIngestionOpen(false)}
        onNoteCreated={handleNoteCreated}
      />

      {/* Note Detail Modal */}
      <NoteDetailModal
        note={selectedNote}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedNote(null);
        }}
        onToggleActionItem={handleToggleActionItem}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onToggleArchive={handleToggleArchive}
        onRegenerateNote={handleRegenerateNote}
      />

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p>SmartNotes AI · Full-stack MERN with Gemini 3.8 Flash Multimodal Intelligence</p>
      </footer>
    </div>
  );
}
