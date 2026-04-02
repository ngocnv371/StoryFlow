import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setGenerationProvider, setImageGenConfig } from '../../store/configSlice';
import { AIProvider } from '../../types';
import { DEFAULT_GEMINI_STANDARD_ASPECT_RATIO, GEMINI_STANDARD_ASPECT_RATIOS } from '../../constants';

const ImageGenSettingsTab: React.FC = () => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1">Provider</label>
        <select
          value={config.generationProviders.image}
          onChange={(e) => dispatch(setGenerationProvider({ generationType: 'image', provider: e.target.value as AIProvider }))}
          className="w-full p-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="gemini">Gemini</option>
          <option value="comfyui">ComfyUI</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1">Aspect Ratio</label>
        <select
          value={config.imageGen.aspectRatio ?? DEFAULT_GEMINI_STANDARD_ASPECT_RATIO}
          onChange={(e) => dispatch(setImageGenConfig({ aspectRatio: e.target.value as (typeof GEMINI_STANDARD_ASPECT_RATIOS)[number] }))}
          className="w-full p-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          {GEMINI_STANDARD_ASPECT_RATIOS.map((ratio) => (
            <option key={ratio} value={ratio}>
              {ratio}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1">CFG</label>
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
          className="w-full p-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );
};

export default ImageGenSettingsTab;
