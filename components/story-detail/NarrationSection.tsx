import React from 'react';
import NarrationGenerator from '../NarrationGenerator';
import { Story } from '../../types';

interface NarrationSectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

const NarrationSection: React.FC<NarrationSectionProps> = ({ story, onUpdate }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800">Narration</h3>
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Narrator</label>
        <textarea
          rows={3}
          value={story.narrator || ''}
          onChange={e => onUpdate({ narrator: e.target.value })}
          className="w-full p-3 border rounded-xl bg-slate-50 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="e.g., Morgan Freeman, David Attenborough..."
        />
      </div>
      <NarrationGenerator story={story} />
      {story.audio_url && (
        <div className="p-4 bg-slate-50 rounded-xl space-y-2 border">
          <p className="text-xs font-bold text-slate-400 uppercase">Current Narration</p>
          <audio controls className="w-full h-10" src={story.audio_url}></audio>
        </div>
      )}
    </div>
  );
};

export default NarrationSection;
