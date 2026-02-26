import React from 'react';
import { useSelector } from 'react-redux';
import NarrationGenerator from '../NarrationGenerator';
import { Story } from '../../types';
import { RootState } from '../../store';
import { getStoryGenerationOverrides, resolveStoryConfig, withStoryGenerationOverrides } from '../../services/storyMetadata';

interface NarrationSectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

const NarrationSection: React.FC<NarrationSectionProps> = ({ story, onUpdate }) => {
  const config = useSelector((state: RootState) => state.config);
  const storyConfig = resolveStoryConfig(config, story);
  const generationOverrides = getStoryGenerationOverrides(story);

  const handleNarrationVoiceChange = (value: string) => {
    const voice = value.trim();

    onUpdate({
      metadata: withStoryGenerationOverrides(story, {
        ...generationOverrides,
        narration: {
          ...generationOverrides.narration,
          voice: voice.length > 0 ? voice : undefined,
        },
      }),
    });
  };

  const handleNarrationSpeedChange = (rawValue: string) => {
    const parsedValue = rawValue === '' ? undefined : Number(rawValue);
    const safeValue = typeof parsedValue === 'number' && Number.isFinite(parsedValue) && parsedValue > 0
      ? parsedValue
      : undefined;

    onUpdate({
      metadata: withStoryGenerationOverrides(story, {
        ...generationOverrides,
        narration: {
          ...generationOverrides.narration,
          speed: safeValue,
        },
      }),
    });
  };

  const handleResetNarrationOverrides = () => {
    onUpdate({
      metadata: withStoryGenerationOverrides(story, {
        ...generationOverrides,
        narration: {},
      }),
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Narration</h3>
        <button
          type="button"
          onClick={handleResetNarrationOverrides}
          className="text-xs text-indigo-600 font-semibold hover:text-indigo-700"
        >
          Reset Voice/Speed
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Voice</label>
          <input
            type="text"
            value={storyConfig.audioGen.voice ?? ''}
            onChange={(event) => handleNarrationVoiceChange(event.target.value)}
            className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="e.g. Kore"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Speed</label>
          <input
            type="number"
            min={0.1}
            step={0.05}
            value={storyConfig.audioGen.speed ?? ''}
            onChange={(event) => handleNarrationSpeedChange(event.target.value)}
            className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

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
