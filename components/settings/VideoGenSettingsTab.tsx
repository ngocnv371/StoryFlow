import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setVideoGenConfig } from '../../store/configSlice';

const VideoGenSettingsTab: React.FC = () => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-4">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Enable Ken Burns</p>
            <p className="text-xs text-slate-500">Slow zoom and pan to avoid static-looking frames.</p>
          </div>
          <input
            type="checkbox"
            checked={config.video.enableKenBurns}
            onChange={(e) => dispatch(setVideoGenConfig({ enableKenBurns: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Enable Particles</p>
            <p className="text-xs text-slate-500">Subtle floating particles over the image.</p>
          </div>
          <input
            type="checkbox"
            checked={config.video.enableParticles}
            onChange={(e) => dispatch(setVideoGenConfig({ enableParticles: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />
        </label>
      </div>
    </div>
  );
};

export default VideoGenSettingsTab;
