import React from 'react';
import VideoGenerator from '../VideoGenerator';
import { Story } from '../../types';

interface VideoSectionProps {
  story: Story;
}

const VideoSection: React.FC<VideoSectionProps> = ({ story }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Video</h3>
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
