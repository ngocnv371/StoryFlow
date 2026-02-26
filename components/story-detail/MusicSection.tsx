import React from 'react';
import BackgroundMusicGenerator from '../BackgroundMusicGenerator';
import { Story } from '../../types';

interface MusicSectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

const MusicSection: React.FC<MusicSectionProps> = ({ story, onUpdate }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800">Background Music</h3>
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Music</label>
        <textarea
          rows={3}
          value={story.music || ''}
          onChange={e => onUpdate({ music: e.target.value })}
          className="w-full p-3 border rounded-xl bg-slate-50 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="e.g., Calm piano, Epic orchestral..."
        />
      </div>
      <BackgroundMusicGenerator story={story} />
      {story.music_url && (
        <div className="p-4 bg-slate-50 rounded-xl space-y-2 border">
          <p className="text-xs font-bold text-slate-400 uppercase">Current Background Music</p>
          <audio controls className="w-full h-10" src={story.music_url}></audio>
        </div>
      )}
    </div>
  );
};

export default MusicSection;
