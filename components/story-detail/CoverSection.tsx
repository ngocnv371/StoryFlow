import React from 'react';
import { useSelector } from 'react-redux';
import CoverGenerator from '../CoverGenerator';
import { Story } from '../../types';
import { RootState } from '../../store';
import { getStoryGenerationOverrides, resolveStoryConfig, withStoryGenerationOverrides } from '../../services/storyMetadata';

interface CoverSectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
  onOpenInspector: () => void;
}

const CoverSection: React.FC<CoverSectionProps> = ({ story, onUpdate, onOpenInspector }) => {
  const config = useSelector((state: RootState) => state.config);
  const storyConfig = resolveStoryConfig(config, story);
  const generationOverrides = getStoryGenerationOverrides(story);

  const handleCoverSizeChange = (key: 'width' | 'height', rawValue: string) => {
    const parsedValue = rawValue === '' ? undefined : Number(rawValue);
    const safeValue = typeof parsedValue === 'number' && Number.isFinite(parsedValue) && parsedValue > 0
      ? Math.round(parsedValue)
      : undefined;

    onUpdate({
      metadata: withStoryGenerationOverrides(story, {
        ...generationOverrides,
        cover: {
          ...generationOverrides.cover,
          [key]: safeValue,
        },
      }),
    });
  };

  const handleResetCoverOverrides = () => {
    onUpdate({
      metadata: withStoryGenerationOverrides(story, {
        ...generationOverrides,
        cover: {},
      }),
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Cover</h3>
        <button
          type="button"
          onClick={handleResetCoverOverrides}
          className="text-xs text-indigo-600 font-semibold hover:text-indigo-700"
        >
          Reset Cover Size
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Width</label>
          <input
            type="number"
            min={1}
            value={storyConfig.imageGen.width ?? ''}
            onChange={(event) => handleCoverSizeChange('width', event.target.value)}
            className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Height</label>
          <input
            type="number"
            min={1}
            value={storyConfig.imageGen.height ?? ''}
            onChange={(event) => handleCoverSizeChange('height', event.target.value)}
            className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cover Prompt</label>
        <textarea
          rows={4}
          value={story.cover_prompt || ''}
          onChange={e => onUpdate({ cover_prompt: e.target.value })}
          className="w-full p-3 border rounded-xl bg-slate-50 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="A concise but vivid image-generation prompt for the story cover art"
        />
      </div>
      <div onClick={onOpenInspector} className="aspect-video rounded-xl overflow-hidden cursor-pointer group relative">
        <img src={story.thumbnail_url || 'https://via.placeholder.com/400x225?text=No+Cover'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Story Cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>
      <CoverGenerator story={story} />
    </div>
  );
};

export default CoverSection;
