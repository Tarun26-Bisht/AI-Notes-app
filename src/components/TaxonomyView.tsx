import React, { useState } from 'react';
import { TagCount } from '../types/note';
import { Tags, ArrowRight, Search } from 'lucide-react';

interface TaxonomyViewProps {
  tags: TagCount[];
  onSelectTag: (tag: string) => void;
}

export const TaxonomyView: React.FC<TaxonomyViewProps> = ({ tags, onSelectTag }) => {
  const [tagSearch, setTagSearch] = useState<string>('');

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Tags className="w-4 h-4 text-blue-600" />
            <span>AI Knowledge Taxonomy & Auto-Tags</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gemini 3.8 Flash automatically extracts and organizes domain taxonomy across all ingested notes
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Search tags..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
          />
        </div>
      </div>

      {/* Tags Grid */}
      {filteredTags.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Tags className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No matching tags found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredTags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => onSelectTag(tag.name)}
              className="p-4 bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs rounded-xl text-left transition-all group flex items-center justify-between"
            >
              <div>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors block">
                  #{tag.name}
                </span>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {tag.count} {tag.count === 1 ? 'note' : 'notes'}
                </span>
              </div>

              <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
