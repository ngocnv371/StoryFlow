
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setAudioGenStatus, updateStoryRemote } from '../store/storiesSlice';
import { showAlert } from '../store/uiSlice';
import { generateAudioSpeech } from '../services/aiService';
import { Story } from '../types';
import { resolveStoryConfig } from '../services/storyMetadata';

interface NarrationGeneratorProps {
  story: Story;
}

const NarrationGenerator: React.FC<NarrationGeneratorProps> = ({ story }) => {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((state: RootState) => state.config);
  const effectiveConfig = resolveStoryConfig(config, story);
  const status = useSelector((state: RootState) => state.stories.audioGenerationStatuses[story.id] || 'idle');

  const handleGenerate = async () => {
    if (!story.transcript) {
      dispatch(showAlert({
        title: 'Missing Content',
        message: 'Please generate or write a transcript before creating a narration.',
        type: 'warning'
      }));
      return;
    }

    dispatch(setAudioGenStatus({ id: story.id, status: 'generating' }));
    try {
      const narration = await generateAudioSpeech(effectiveConfig, story);
      await dispatch(updateStoryRemote({ ...story, audio_url: narration.url, duration: narration.duration }));
      dispatch(setAudioGenStatus({ id: story.id, status: 'idle' }));
      dispatch(showAlert({
        title: 'Success!',
        message: 'Your story narration has been generated and saved.',
        type: 'success'
      }));
    } catch (error: any) {
      console.error(error);
      dispatch(setAudioGenStatus({ id: story.id, status: 'error' }));
      dispatch(showAlert({
        title: 'Generation Failed',
        message: error.message || 'An unexpected error occurred during audio generation.',
        type: 'error'
      }));
    }
  };

  const isGenerating = status === 'generating';

  return (
    <div className="relative">
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full group flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
          isGenerating 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-emerald-200 hover:-translate-y-0.5'
        }`}
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Generating Narration...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>Generate Narration</span>
          </>
        )}
      </button>
    </div>
  );
};

export default NarrationGenerator;
