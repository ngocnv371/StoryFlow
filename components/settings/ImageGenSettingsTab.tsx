import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setGenerationProvider, setImageGenConfig } from '../../store/configSlice';
import { AIProvider } from '../../types';

const ImageGenSettingsTab: React.FC = () => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
        <select
          value={config.generationProviders.image}
          onChange={(e) => dispatch(setGenerationProvider({ generationType: 'image', provider: e.target.value as AIProvider }))}
          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="gemini">Gemini</option>
          <option value="comfyui">ComfyUI</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Width</label>
        <input
          type="number"
          min="256"
          step="64"
          value={config.imageGen.width ?? 1280}
          onChange={(e) => {
            const width = Number.parseInt(e.target.value, 10);
            dispatch(setImageGenConfig({ width: Number.isNaN(width) ? 1280 : width }));
          }}
          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Height</label>
        <input
          type="number"
          min="256"
          step="64"
          value={config.imageGen.height ?? 720}
          onChange={(e) => {
            const height = Number.parseInt(e.target.value, 10);
            dispatch(setImageGenConfig({ height: Number.isNaN(height) ? 720 : height }));
          }}
          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">CFG</label>
        <input
          type="number"
          min="1"
          max="20"
          step="0.5"
          value={config.imageGen.cfg ?? 7}
          onChange={(e) => {
            const cfg = Number.parseFloat(e.target.value);
            dispatch(setImageGenConfig({ cfg: Number.isNaN(cfg) ? 7 : cfg }));
          }}
          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );
};

export default ImageGenSettingsTab;
