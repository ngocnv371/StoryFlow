import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { setMusicGenStatus, updateStoryRemote } from '../store/storiesSlice';
import { showAlert } from '../store/uiSlice';
import { generateBackgroundMusic } from '../services/aiService';
import { Story } from '../types';

interface BackgroundMusicGeneratorProps {
  story: Story;
}

const BackgroundMusicGenerator: React.FC<BackgroundMusicGeneratorProps> = ({ story }) => {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((state: RootState) => state.config);
  const status = useSelector((state: RootState) => state.stories.musicGenerationStatuses[story.id] || 'idle');

  const handleGenerate = async () => {
    if (!story.music?.trim()) {
      dispatch(showAlert({
        title: 'Missing Music Prompt',
        message: 'Please provide a music description before generating background music.',
        type: 'warning'
      }));
      return;
    }

    if (!config.comfy.endpoint?.trim()) {
      dispatch(showAlert({
        title: 'ComfyUI Not Configured',
        message: 'Set a ComfyUI endpoint in Settings to generate background music.',
        type: 'error'
      }));
      return;
    }

    dispatch(setMusicGenStatus({ id: story.id, status: 'generating' }));
    try {
      const musicUrl = await generateBackgroundMusic(config, story);
      await dispatch(updateStoryRemote({ ...story, music_url: musicUrl }));
      dispatch(setMusicGenStatus({ id: story.id, status: 'idle' }));
      dispatch(showAlert({
        title: 'Success!',
        message: 'Background music has been generated and saved.',
        type: 'success'
      }));
    } catch (error: any) {
      console.error(error);
      dispatch(setMusicGenStatus({ id: story.id, status: 'error' }));
      dispatch(showAlert({
        title: 'Music Generation Failed',
        message: error.message || 'An unexpected error occurred during music generation.',
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
            : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-violet-200 hover:-translate-y-0.5'
        }`}
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Composing Music...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-2v13M9 19a2 2 0 11-4 0 2 2 0 014 0zm12-2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Generate Music</span>
          </>
        )}
      </button>
    </div>
  );
};

export default BackgroundMusicGenerator;
