
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { setTranscriptGenStatus, updateStoryRemote } from '../store/storiesSlice';
import { extendStoryTranscript, generateStoryTranscript } from '../services/aiService';
import { Story } from '../types';
import toast from 'react-hot-toast';

interface TranscriptGeneratorProps {
  story: Story;
  onGenerated?: (data: Pick<Story, "title" | "transcript" | "narrator" | "music" | "cover_prompt" | "tags">) => void;
}

const TranscriptGenerator: React.FC<TranscriptGeneratorProps> = ({ story, onGenerated }) => {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((state: RootState) => state.config);
  const status = useSelector((state: RootState) => state.stories.transcriptGenerationStatuses[story.id] || 'idle');

  const handleGenerate = async () => {
    if (!story.title || !story.summary) {
      toast('Please provide at least a title and a summary before generating a transcript.');
      return;
    }

    dispatch(setTranscriptGenStatus({ id: story.id, status: 'generating' }));
    try {
      const { title, transcript, narrator, music, cover_prompt, tags } = await generateStoryTranscript(config, story);
      
      const status = story.status === 'Draft' ? 'Pending' : story.status;
      // Update remote storage with all fields
      await dispatch(updateStoryRemote({ ...story, title, transcript, narrator, music, cover_prompt, tags, status }));
      
      // Notify parent to update local state immediately if needed
      if (onGenerated) {
        onGenerated({ title, transcript, narrator, music, cover_prompt, tags });
      }
      
      dispatch(setTranscriptGenStatus({ id: story.id, status: 'idle' }));
      toast.success('Your story transcript has been conjured.');
    } catch (error: any) {
      console.error(error);
      dispatch(setTranscriptGenStatus({ id: story.id, status: 'error' }));
      toast.error(error.message || 'Failed to generate transcript. Check your API settings.');
    }
  };

  const handleExtend = async () => {
    if (!story.transcript?.trim()) {
      toast('Please generate or write a transcript first before extending it.');
      return;
    }

    dispatch(setTranscriptGenStatus({ id: story.id, status: 'generating' }));
    try {
      const nextPart = await extendStoryTranscript(config, story.tags || [], story.transcript);
      const appended = nextPart?.trim();
      if (!appended) {
        throw new Error('Text generation returned an empty continuation.');
      }

      const separator = story.transcript.trimEnd().length > 0 ? '\n\n' : '';
      const transcript = `${story.transcript.trimEnd()}${separator}${appended}`;
      const status = story.status === 'Draft' ? 'Pending' : story.status;

      await dispatch(updateStoryRemote({ ...story, transcript, status }));

      if (onGenerated) {
        onGenerated({
          title: story.title,
          transcript,
          narrator: story.narrator,
          music: story.music,
          cover_prompt: story.cover_prompt,
          tags: story.tags,
        });
      }

      dispatch(setTranscriptGenStatus({ id: story.id, status: 'idle' }));
      toast.success('The next part has been appended to your transcript.');
    } catch (error: any) {
      console.error(error);
      dispatch(setTranscriptGenStatus({ id: story.id, status: 'error' }));
      toast.error(error.message || 'Failed to extend transcript. Check your API settings.');
    }
  };

  const isGenerating = status === 'generating';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExtend}
        disabled={isGenerating}
        className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm border ${
          isGenerating
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        {isGenerating ? (
          <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        )}
        {isGenerating ? 'Casting Spell...' : 'Extend Transcript'}
      </button>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm border ${
          isGenerating
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        {isGenerating ? (
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
        {isGenerating ? 'Casting Spell...' : 'Magic Transcript'}
      </button>
    </div>
  );
};

export default TranscriptGenerator;
