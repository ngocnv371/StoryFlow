import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { setVideoGenStatus } from '../store/storiesSlice';
import { showAlert } from '../store/uiSlice';
import { compileStoryVideo, downloadVideo } from '../services/video';
import { Story } from '../types';

interface VideoGeneratorProps {
  story: Story;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ story }) => {
  const dispatch = useDispatch<AppDispatch>();
  const status = useSelector((state: RootState) => state.stories.videoGenerationStatuses[story.id] || 'idle');
  const [showTooltip, setShowTooltip] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const handleDownload = () => {
    if (videoBlob) {
      const filename = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_video.webm`;
      downloadVideo(videoBlob, filename);
      
      dispatch(showAlert({
        title: 'Video Downloaded!',
        message: 'Your story video has been downloaded in WebM format with VP9 codec.',
        type: 'success'
      }));
    }
  };

  const handleCompile = async () => {
    if (!story.thumbnail_url) {
      dispatch(showAlert({
        title: 'Cover Art Required',
        message: 'Please generate a cover photo first before compiling the video.',
        type: 'error'
      }));
      return;
    }

    if (!story.audio_url) {
      dispatch(showAlert({
        title: 'Audio Required',
        message: 'Please generate audio first before compiling the video.',
        type: 'error'
      }));
      return;
    }

    dispatch(setVideoGenStatus({ id: story.id, status: 'generating' }));
    setProgress(0);
    
    try {
      const compiledVideoBlob = await compileStoryVideo(
        story.thumbnail_url,
        story.audio_url,
        (progressValue) => setProgress(Math.round(progressValue * 100))
      );
      
      console.log('Video compilation completed. Blob size:', compiledVideoBlob.size, 'bytes');
      
      if (compiledVideoBlob.size === 0) {
        throw new Error('Video compilation resulted in empty file');
      }
      
      // Store the video blob and create preview URL
      setVideoBlob(compiledVideoBlob);
      const previewUrl = URL.createObjectURL(compiledVideoBlob);
      setVideoPreviewUrl(previewUrl);
      
      dispatch(setVideoGenStatus({ id: story.id, status: 'idle' }));
      
      dispatch(showAlert({
        title: 'Video Compiled!',
        message: 'Preview your video below. Click download if you\'re satisfied.',
        type: 'success'
      }));
      
    } catch (error: any) {
      console.error(error);
      dispatch(setVideoGenStatus({ id: story.id, status: 'error' }));
      
      let errorMessage = error.message || 'Failed to compile video. Please try again.';
      
      // Provide specific guidance for VideoEncoder support
      if (error.message?.includes('VideoEncoder API is not available')) {
        errorMessage = 'Your browser doesn\'t support advanced video encoding. Please use Chrome 94+, Edge 94+, or another modern browser.';
      }
      
      dispatch(showAlert({
        title: 'Video Compilation Failed',
        message: errorMessage,
        type: 'error'
      }));
    } finally {
      setProgress(0);
    }
  };

  const handleReset = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoBlob(null);
    setVideoPreviewUrl(null);
  };

  const isGenerating = status === 'generating';
  const hasRequiredAssets = story.thumbnail_url && story.audio_url;
  const hasCompiledVideo = videoBlob && videoPreviewUrl;

  return (
    <div className="relative space-y-4">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleCompile}
        disabled={isGenerating || !hasRequiredAssets}
        className={`w-full group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
          isGenerating 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : !hasRequiredAssets
            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-purple-200 hover:-translate-y-0.5'
        }`}
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Compiling Video... {progress}%</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16l13-8L7 4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4-4m0 0l-4-4m4 4H10" />
            </svg>
            <span>Compile Video</span>
          </>
        )}
      </button>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 p-4 bg-slate-900 text-white text-[11px] rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <div className="font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            Video Compilation
          </div>
          <div className="space-y-2 opacity-90 text-[10px]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${story.thumbnail_url ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span>Cover Art: {story.thumbnail_url ? 'Ready' : 'Required'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${story.audio_url ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span>Audio: {story.audio_url ? 'Ready' : 'Required'}</span>
            </div>
            <p className="mt-2 italic leading-relaxed text-slate-300">
              Creates a video using hybrid MediaRecorder approach with precise frame control at 24 FPS, matching audio duration with your cover art as the background.
            </p>
          </div>
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
        </div>
      )}

      {hasCompiledVideo && (
        <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Video Preview</h3>
            <button
              onClick={handleReset}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <video 
              controls 
              className="w-full h-full" 
              src={videoPreviewUrl}
              title="Compiled video preview"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-green-200 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Video
            </button>
            
            <div className="text-xs text-gray-500 flex items-center px-3">
              Size: {(videoBlob.size / (1024 * 1024)).toFixed(2)} MB
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;