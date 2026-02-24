import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  setAudioGenStatus,
  setImageGenStatus,
  setTranscriptGenStatus,
  setVideoGenStatus,
  updateStoryRemote,
} from '../store/storiesSlice';
import { showAlert } from '../store/uiSlice';
import { Story } from '../types';
import { generateAudioSpeech, generateCoverImage, generateStoryTranscript, uploadVideoToSupabase } from '../services/aiService';
import { compileStoryVideo } from '../services/encoder-webm';

interface AutoGenerationOptions {
  transcript: boolean;
  cover: boolean;
  audio: boolean;
  video: boolean;
}

const DEFAULT_AUTO_GENERATION_OPTIONS: AutoGenerationOptions = {
  transcript: true,
  cover: true,
  audio: true,
  video: true,
};

interface AutoGenerateButtonProps {
  story: Story;
  onStoryUpdated: (story: Story) => void;
}

const AutoGenerateButton: React.FC<AutoGenerateButtonProps> = ({ story, onStoryUpdated }) => {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((state: RootState) => state.config);
  const [isAutoDialogOpen, setIsAutoDialogOpen] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [autoGeneratingStep, setAutoGeneratingStep] = useState('');
  const [autoGenerationOptions, setAutoGenerationOptions] = useState<AutoGenerationOptions>(DEFAULT_AUTO_GENERATION_OPTIONS);

  const openAutoDialog = () => {
    setAutoGenerationOptions(DEFAULT_AUTO_GENERATION_OPTIONS);
    setIsAutoDialogOpen(true);
  };

  const updateStoryLocallyAndRemotely = async (nextStory: Story) => {
    onStoryUpdated(nextStory);
    await dispatch(updateStoryRemote(nextStory));
  };

  const handleAutoGenerate = async () => {
    setIsAutoDialogOpen(false);
    setIsAutoGenerating(true);
    let nextStory = story;
    let currentStage: keyof AutoGenerationOptions | null = null;

    try {
      const shouldGenerateTranscript = autoGenerationOptions.transcript || !nextStory.transcript?.trim();
      if (shouldGenerateTranscript) {
        currentStage = 'transcript';
        if (!nextStory.title || !nextStory.summary) {
          throw new Error('Please provide at least a title and a summary before generating a transcript.');
        }

        setAutoGeneratingStep('Generating transcript...');
        dispatch(setTranscriptGenStatus({ id: nextStory.id, status: 'generating' }));

        const transcriptData = await generateStoryTranscript(config, nextStory);
        nextStory = {
          ...nextStory,
          title: transcriptData.title,
          transcript: transcriptData.transcript,
          narrator: transcriptData.narrator,
          music: transcriptData.music,
          cover_prompt: transcriptData.cover_prompt,
          tags: transcriptData.tags,
        };

        await updateStoryLocallyAndRemotely(nextStory);
        dispatch(setTranscriptGenStatus({ id: nextStory.id, status: 'idle' }));
      }

      const shouldGenerateCover = autoGenerationOptions.cover || !nextStory.thumbnail_url?.trim();
      if (shouldGenerateCover) {
        currentStage = 'cover';
        setAutoGeneratingStep('Generating cover...');
        dispatch(setImageGenStatus({ id: nextStory.id, status: 'generating' }));

        const imageUrl = await generateCoverImage(config, nextStory);
        nextStory = { ...nextStory, thumbnail_url: imageUrl };
        await updateStoryLocallyAndRemotely(nextStory);

        dispatch(setImageGenStatus({ id: nextStory.id, status: 'idle' }));
      }

      const shouldGenerateAudio = autoGenerationOptions.audio || !nextStory.audio_url?.trim();
      if (shouldGenerateAudio) {
        currentStage = 'audio';
        if (!nextStory.transcript?.trim()) {
          throw new Error('Please generate or write a transcript before creating a narration.');
        }

        setAutoGeneratingStep('Generating audio...');
        dispatch(setAudioGenStatus({ id: nextStory.id, status: 'generating' }));

        const audioUrl = await generateAudioSpeech(config, nextStory);
        nextStory = { ...nextStory, audio_url: audioUrl };
        await updateStoryLocallyAndRemotely(nextStory);

        dispatch(setAudioGenStatus({ id: nextStory.id, status: 'idle' }));
      }

      const shouldGenerateVideo = autoGenerationOptions.video || !nextStory.video_url?.trim();
      if (shouldGenerateVideo) {
        currentStage = 'video';
        if (!nextStory.thumbnail_url?.trim()) {
          throw new Error('Please generate a cover photo first before compiling the video.');
        }
        if (!nextStory.audio_url?.trim()) {
          throw new Error('Please generate audio first before compiling the video.');
        }

        setAutoGeneratingStep('Compiling and saving video...');
        dispatch(setVideoGenStatus({ id: nextStory.id, status: 'generating' }));

        const videoBlob = await compileStoryVideo(nextStory.thumbnail_url, nextStory.audio_url, () => undefined);
        const videoUrl = await uploadVideoToSupabase(nextStory.id, videoBlob);
        nextStory = { ...nextStory, video_url: videoUrl };
        await updateStoryLocallyAndRemotely(nextStory);

        dispatch(setVideoGenStatus({ id: nextStory.id, status: 'idle' }));
      }

      currentStage = null;

      dispatch(showAlert({
        title: 'Automation Complete',
        message: 'Selected generation steps completed successfully.',
        type: 'success',
      }));
    } catch (error: any) {
      if (currentStage === 'transcript') {
        dispatch(setTranscriptGenStatus({ id: nextStory.id, status: 'error' }));
      }
      if (currentStage === 'cover') {
        dispatch(setImageGenStatus({ id: nextStory.id, status: 'error' }));
      }
      if (currentStage === 'audio') {
        dispatch(setAudioGenStatus({ id: nextStory.id, status: 'error' }));
      }
      if (currentStage === 'video') {
        dispatch(setVideoGenStatus({ id: nextStory.id, status: 'error' }));
      }

      dispatch(showAlert({
        title: 'Automation Failed',
        message: error?.message || 'An error occurred while running the generation pipeline.',
        type: 'error',
      }));
    } finally {
      setAutoGeneratingStep('');
      setIsAutoGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={openAutoDialog}
        disabled={isAutoGenerating}
        className={`px-4 py-2 rounded-xl font-bold border transition-all ${
          isAutoGenerating
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
        }`}
      >
        {isAutoGenerating ? autoGeneratingStep || 'Running...' : 'Auto Generate'}
      </button>

      {isAutoDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Automation Options</h3>
              <button
                onClick={() => setIsAutoDialogOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-500">Choose which outputs to regenerate. Unchecked items run only when missing.</p>

              <label className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50">
                <input
                  type="checkbox"
                  checked={autoGenerationOptions.transcript}
                  onChange={(e) => setAutoGenerationOptions(prev => ({ ...prev, transcript: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="font-medium text-slate-700">Transcript</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50">
                <input
                  type="checkbox"
                  checked={autoGenerationOptions.cover}
                  onChange={(e) => setAutoGenerationOptions(prev => ({ ...prev, cover: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="font-medium text-slate-700">Cover</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50">
                <input
                  type="checkbox"
                  checked={autoGenerationOptions.audio}
                  onChange={(e) => setAutoGenerationOptions(prev => ({ ...prev, audio: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="font-medium text-slate-700">Audio</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50">
                <input
                  type="checkbox"
                  checked={autoGenerationOptions.video}
                  onChange={(e) => setAutoGenerationOptions(prev => ({ ...prev, video: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="font-medium text-slate-700">Video</span>
              </label>
            </div>

            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsAutoDialogOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAutoGenerate}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Run Automation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AutoGenerateButton;