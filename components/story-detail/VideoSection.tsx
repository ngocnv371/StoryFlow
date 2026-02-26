import React from 'react';
import { useSelector } from 'react-redux';
import VideoGenerator from '../VideoGenerator';
import { Story, StoryGenerationOverrides } from '../../types';
import { RootState } from '../../store';
import { getStoryGenerationOverrides, resolveStoryConfig, withStoryGenerationOverrides } from '../../services/storyMetadata';

interface VideoSectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

const VideoSection: React.FC<VideoSectionProps> = ({ story, onUpdate }) => {
  const config = useSelector((state: RootState) => state.config);
  const storyConfig = resolveStoryConfig(config, story);
  const generationOverrides = getStoryGenerationOverrides(story);

  const handleOverridesChange = (overrides: StoryGenerationOverrides) => {
    onUpdate({ metadata: withStoryGenerationOverrides(story, overrides) });
  };

  const handleVideoToggle = (key: 'enableKenBurns' | 'enableParticles', checked: boolean) => {
    handleOverridesChange({
      ...generationOverrides,
      video: {
        ...generationOverrides.video,
        [key]: checked,
      },
    });
  };

  const handleResetOverrides = () => {
    handleOverridesChange({
      ...generationOverrides,
      video: {},
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Video</h3>
      </div>

      <div className="p-4 bg-slate-50 rounded-xl border space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Video Overrides</h4>
          <button
            type="button"
            onClick={handleResetOverrides}
            className="text-xs text-indigo-600 font-semibold hover:text-indigo-700"
          >
            Reset Video Effects
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Video Effects</p>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg bg-white">
              <input
                type="checkbox"
                checked={storyConfig.video.enableKenBurns}
                onChange={(event) => handleVideoToggle('enableKenBurns', event.target.checked)}
              />
              <span className="text-sm text-slate-700">Ken Burns</span>
            </label>

            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg bg-white">
              <input
                type="checkbox"
                checked={storyConfig.video.enableParticles}
                onChange={(event) => handleVideoToggle('enableParticles', event.target.checked)}
              />
              <span className="text-sm text-slate-700">Particles</span>
            </label>
          </div>
        </div>
      </div>

      <VideoGenerator story={story} />
      {story.video_url && (
        <div className="p-4 bg-slate-50 rounded-xl space-y-2 border">
          <p className="text-xs font-bold text-slate-400 uppercase">Saved Video</p>
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <video
              controls
              className="w-full h-full"
              src={story.video_url}
              title="Story video"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSection;
