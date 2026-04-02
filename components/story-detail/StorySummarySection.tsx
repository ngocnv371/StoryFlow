import React from 'react';
import { Story, StoryTranscriptForm } from '../../types';

interface StorySummarySectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

const StorySummarySection: React.FC<StorySummarySectionProps> = ({ story, onUpdate }) => {
  const transcriptForm: StoryTranscriptForm = story.metadata?.transcript_form === 'short' ? 'short' : 'long';

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border shadow-sm">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Title</label>
          <input
            value={story.title}
            onChange={e => onUpdate({ title: e.target.value })}
            className="w-full p-3 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary</label>
          <textarea
            rows={3}
            value={story.summary}
            onChange={e => onUpdate({ summary: e.target.value })}
            className="w-full p-3 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="w-36">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transcript Form</label>
          <select
            value={transcriptForm}
            onChange={e => {
              const value = e.target.value === 'short' ? 'short' : 'long';
              onUpdate({
                metadata: {
                  ...(story.metadata ?? {}),
                  transcript_form: value,
                },
              });
            }}
            className="w-full p-3 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="long">Long form</option>
            <option value="short">Short form</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default StorySummarySection;
