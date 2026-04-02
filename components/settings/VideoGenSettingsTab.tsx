import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setVideoGenConfig } from '../../store/configSlice';

const VideoGenSettingsTab: React.FC = () => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);

  const imagesNeeded = Math.ceil((config.video.frameDuration || 3000) / 1000 * (config.video.fps || 30));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700 p-4 bg-slate-900 space-y-4">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-100">Enable Ken Burns</p>
            <p className="text-xs text-slate-500">Slow zoom and pan to avoid static-looking frames.</p>
          </div>
          <input
            type="checkbox"
            checked={config.video.enableKenBurns}
            onChange={(e) => dispatch(setVideoGenConfig({ enableKenBurns: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-100">Enable Particles</p>
            <p className="text-xs text-slate-500">Subtle floating particles over the image.</p>
          </div>
          <input
            type="checkbox"
            checked={config.video.enableParticles}
            onChange={(e) => dispatch(setVideoGenConfig({ enableParticles: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-700 p-4 bg-slate-900 space-y-4">
        <div>
          <label className="flex items-center justify-between gap-3 mb-2">
            <div>
              <p className="text-sm font-medium text-slate-100">FPS (Frames Per Second)</p>
              <p className="text-xs text-slate-500">Video playback frame rate.</p>
            </div>
            <input
              type="number"
              min="1"
              max="60"
              value={config.video.fps || 30}
              onChange={(e) => dispatch(setVideoGenConfig({ fps: Math.max(1, parseInt(e.target.value) || 30) }))}
              className="w-20 px-3 py-1 bg-slate-800 border border-slate-600 rounded text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </label>
        </div>

        <div>
          <label className="flex items-center justify-between gap-3 mb-2">
            <div>
              <p className="text-sm font-medium text-slate-100">Frame Duration</p>
              <p className="text-xs text-slate-500">How long each image displays (milliseconds).</p>
            </div>
            <input
              type="number"
              min="100"
              step="100"
              value={config.video.frameDuration || 3000}
              onChange={(e) => dispatch(setVideoGenConfig({ frameDuration: Math.max(100, parseInt(e.target.value) || 3000) }))}
              className="w-24 px-3 py-1 bg-slate-800 border border-slate-600 rounded text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="pt-2 border-t border-slate-700">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Images needed per narration second:</span> {imagesNeeded}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            For a 30-second narration, you'll need approximately {imagesNeeded * 30} images.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoGenSettingsTab;
