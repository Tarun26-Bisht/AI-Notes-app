import React, { useState } from 'react';
import { SmartNote, ActionItem } from '../types/note';
import { CheckSquare, Square, CheckCircle2, ArrowUpRight, Search, Filter } from 'lucide-react';

interface ActionTrackerViewProps {
  notes: SmartNote[];
  onToggleAction: (noteId: string, actionId: string) => void;
  onSelectNote: (note: SmartNote) => void;
}

export const ActionTrackerView: React.FC<ActionTrackerViewProps> = ({
  notes,
  onToggleAction,
  onSelectNote
}) => {
  const [filterState, setFilterState] = useState<'pending' | 'completed' | 'all'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all action items with their parent note reference
  const allActions: Array<{ note: SmartNote; action: ActionItem }> = [];
  for (const note of notes) {
    for (const action of note.actionItems) {
      allActions.push({ note, action });
    }
  }

  // Filter actions
  const filtered = allActions.filter(({ action }) => {
    if (filterState === 'pending' && action.completed) return false;
    if (filterState === 'completed' && !action.completed) return false;
    if (priorityFilter === 'high' && action.priority !== 'high') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return action.text.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount = allActions.filter((a) => !a.action.completed).length;
  const completedCount = allActions.filter((a) => a.action.completed).length;

  return (
    <div className="space-y-6">
      {/* Top Filter Controls (Interactive tabs/segmented controls) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setFilterState('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterState === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterState('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterState === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setFilterState('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterState === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({allActions.length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Priority toggle */}
          <button
            onClick={() => setPriorityFilter(priorityFilter === 'all' ? 'high' : 'all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              priorityFilter === 'high'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>High Priority Only</span>
          </button>

          {/* Search box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No action items found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filterState === 'pending'
              ? 'All caught up! No pending tasks remaining.'
              : 'No action items matched your current filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-xs">
          {filtered.map(({ note, action }) => (
            <div
              key={`${note.id}_${action.id}`}
              className={`p-4 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors ${
                action.completed ? 'bg-slate-50/30' : ''
              }`}
            >
              <div
                onClick={() => onToggleAction(note.id, action.id)}
                className="flex items-start gap-3.5 flex-1 min-w-0 cursor-pointer"
              >
                <div className="mt-0.5 shrink-0 text-blue-600">
                  {action.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm leading-relaxed ${
                      action.completed ? 'text-slate-400 line-through' : 'text-slate-800 font-medium'
                    }`}
                  >
                    {action.text}
                  </p>

                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span className="capitalize">{note.sourceType}</span>
                    <span>·</span>
                    <span className="truncate max-w-xs">{note.title}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {action.priority === 'high' && (
                  <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    High
                  </span>
                )}

                <button
                  onClick={() => onSelectNote(note)}
                  title="View full note"
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
