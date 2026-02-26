import React from 'react';
import { Story } from '../../types';

interface StorySummarySectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

const StorySummarySection: React.FC<StorySummarySectionProps> = ({ story, onUpdate }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Title</label>
          <input
            value={story.title}
            onChange={e => onUpdate({ title: e.target.value })}
            className="w-full p-3 border rounded-xl bg-slate-50 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary</label>
          <textarea
            rows={3}
            value={story.summary}
            onChange={e => onUpdate({ summary: e.target.value })}
            className="w-full p-3 border rounded-xl bg-slate-50 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default StorySummarySection;
