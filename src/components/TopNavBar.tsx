import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Plus, CheckSquare, FileText, Tags, Archive, LogOut, User as UserIcon, ChevronDown, ShieldCheck, GraduationCap } from 'lucide-react';
import { User } from '../types/note';

interface TopNavBarProps {
  activeView: 'notes' | 'actions' | 'taxonomy' | 'archive' | 'quiz';
  onViewChange: (view: 'notes' | 'actions' | 'taxonomy' | 'archive' | 'quiz') => void;
  onOpenNewNote: () => void;
  pendingActionsCount: number;
  archivedCount: number;
  currentUser: User | null;
  onLogout: () => void;
  onSwitchUser?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeView,
  onViewChange,
  onOpenNewNote,
  pendingActionsCount,
  archivedCount,
  currentUser,
  onLogout,
  onSwitchUser
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
              SmartNotes AI
            </span>
            <span className="text-[11px] text-slate-500 font-normal block leading-none">
              Private Multi-Modal Workspace
            </span>
          </div>
        </div>

        {/* Zone 2: Nav links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
          <button
            onClick={() => onViewChange('notes')}
            className={`flex items-center gap-2 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeView === 'notes'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>My Notes</span>
          </button>

          <button
            onClick={() => onViewChange('actions')}
            className={`flex items-center gap-2 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
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
            onClick={() => onViewChange('quiz')}
            className={`flex items-center gap-2 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeView === 'quiz'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-purple-600" />
            <span>Exam Quiz</span>
            <span className="ml-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded-full">
              MCQ
            </span>
          </button>

          <button
            onClick={() => onViewChange('taxonomy')}
            className={`flex items-center gap-2 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
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
            className={`flex items-center gap-2 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
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

        {/* Zone 3: Actions + User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenNewNote}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Smart Note</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* User Profile & Logout Menu */}
          {currentUser && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200/80 cursor-pointer"
                title={`${currentUser.name} (${currentUser.email})`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs"
                    style={{ backgroundColor: currentUser.avatarColor || '#2563EB' }}
                  >
                    {getInitials(currentUser.name)}
                  </div>
                )}
                <div className="hidden lg:block text-left max-w-36 truncate">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate leading-none">
                    {currentUser.email}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Signed in as
                    </p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate font-mono">
                      {currentUser.email}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Private Workspace Active</span>
                    </div>
                  </div>

                  <div className="py-1">
                    {onSwitchUser && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onSwitchUser();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Switch User / Test Account</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
