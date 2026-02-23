
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { setImageGenStatus, updateStoryRemote } from '../store/storiesSlice';
import { showAlert } from '../store/uiSlice';
import { generateCoverImage, constructImagePrompt } from '../services/aiService';
import { Story } from '../types';

interface CoverGeneratorProps {
  story: Story;
}

const CoverGenerator: React.FC<CoverGeneratorProps> = ({ story }) => {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((state: RootState) => state.config.imageGen);
  const status = useSelector((state: RootState) => state.stories.imageGenerationStatuses[story.id] || 'idle');
  const [showTooltip, setShowTooltip] = useState(false);

  const prompt = constructImagePrompt(story);

  const handleGenerate = async () => {
    dispatch(setImageGenStatus({ id: story.id, status: 'generating' }));
    try {
      const imageUrl = await generateCoverImage(config, story);
      await dispatch(updateStoryRemote({ ...story, thumbnail_url: imageUrl }));
      dispatch(setImageGenStatus({ id: story.id, status: 'idle' }));
    } catch (error: any) {
      console.error(error);
      dispatch(setImageGenStatus({ id: story.id, status: 'error' }));
      dispatch(showAlert({
        title: 'Art Generation Failed',
        message: error.message || 'Check your Gemini API key in settings.',
        type: 'error'
      }));
    }
  };

  const isGenerating = status === 'generating';

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
          isGenerating 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-200 hover:-translate-y-0.5'
        }`}
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Generating Art...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.341A8.001 8.001 0 114.572 8.659m14.856 6.682l1.374 1.373a1 1 0 010 1.414l-1.374 1.374a1 1 0 01-1.414 0l-1.373-1.374a1 1 0 010-1.414l1.373-1.373a1 1 0 011.414 0z" />
            </svg>
            <span>Magic Cover Photo</span>
          </>
        )}
      </button>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 bg-slate-900 text-white text-[11px] rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <div className="font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.336 16.303a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM16.303 13.336a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0z"></path></svg>
            Generated Prompt
          </div>
          <p className="opacity-80 italic leading-relaxed">
            "{prompt}"
          </p>
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default CoverGenerator;
