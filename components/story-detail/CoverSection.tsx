import React from 'react';
import CoverGenerator from '../CoverGenerator';
import { Story } from '../../types';

interface CoverSectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
  onOpenInspector: () => void;
}

const CoverSection: React.FC<CoverSectionProps> = ({ story, onUpdate, onOpenInspector }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800">Cover</h3>
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
