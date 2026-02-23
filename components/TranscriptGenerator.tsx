
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { setTranscriptGenStatus, updateStoryRemote } from '../store/storiesSlice';
import { showAlert } from '../store/uiSlice';
import { generateStoryTranscript } from '../services/aiService';
import { Story } from '../types';

interface TranscriptGeneratorProps {
  story: Story;
  onGenerated?: (data: Pick<Story, "title" | "transcript" | "narrator" | "music" | "tags">) => void;
}

const TranscriptGenerator: React.FC<TranscriptGeneratorProps> = ({ story, onGenerated }) => {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((state: RootState) => state.config.textGen);
  const status = useSelector((state: RootState) => state.stories.transcriptGenerationStatuses[story.id] || 'idle');

  const handleGenerate = async () => {
    if (!story.title || !story.summary) {
      dispatch(showAlert({
        title: 'Information Required',
        message: 'Please provide at least a title and a summary before generating a transcript.',
        type: 'warning'
      }));
      return;
    }

    dispatch(setTranscriptGenStatus({ id: story.id, status: 'generating' }));
    try {
      const { title, transcript, narrator, music, tags } = await generateStoryTranscript(config, story);
      
      // Update remote storage with all fields
      await dispatch(updateStoryRemote({ ...story, title, transcript, narrator, music, tags }));
      
      // Notify parent to update local state immediately if needed
      if (onGenerated) {
        onGenerated({ title, transcript, narrator, music, tags });
      }
      
      dispatch(setTranscriptGenStatus({ id: story.id, status: 'idle' }));
      dispatch(showAlert({
        title: 'Magic Happens!',
        message: 'Your story transcript has been conjured.',
        type: 'success'
      }));
    } catch (error: any) {
      console.error(error);
      dispatch(setTranscriptGenStatus({ id: story.id, status: 'error' }));
      dispatch(showAlert({
        title: 'Transcript Error',
        message: error.message || 'Failed to generate transcript. Check your API settings.',
        type: 'error'
      }));
    }
  };

  const isGenerating = status === 'generating';

  return (
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
  );
};

export default TranscriptGenerator;
