import React from 'react';
import TranscriptGenerator from '../TranscriptGenerator';
import { TRANSCRIPT_SOFT_LIMIT } from '../../constants';
import { Story } from '../../types';

interface TranscriptSectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

const TranscriptSection: React.FC<TranscriptSectionProps> = ({ story, onUpdate }) => {
  return (
    <div className="bg-white rounded-2xl border shadow-sm h-[700px] flex flex-col overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          <h3 className="font-bold text-slate-800">Transcript Editor</h3>
        </div>
        <TranscriptGenerator
          story={story}
          onGenerated={(data) => onUpdate({
            transcript: data.transcript,
            narrator: data.narrator,
            music: data.music,
            cover_prompt: data.cover_prompt,
            tags: data.tags
          })}
        />
      </div>
      <textarea
        value={story.transcript}
        onChange={e => onUpdate({ transcript: e.target.value })}
        className="flex-1 p-8 text-lg text-slate-700 leading-relaxed outline-none resize-none bg-white font-serif"
        placeholder="Tell your story here, or use the Magic Transcript button to generate a draft based on your summary..."
      />
      <div className="px-4 py-2 border-t bg-slate-50 text-right">
        <span className={`text-xs font-medium ${(story.transcript?.length || 0) > TRANSCRIPT_SOFT_LIMIT ? 'text-amber-600' : 'text-slate-500'}`}>
          {(story.transcript?.length || 0).toLocaleString()} / {TRANSCRIPT_SOFT_LIMIT.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
};

export default TranscriptSection;
