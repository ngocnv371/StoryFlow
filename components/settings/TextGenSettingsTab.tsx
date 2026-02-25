import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setGenerationProvider } from '../../store/configSlice';
import { AIProvider } from '../../types';

const TextGenSettingsTab: React.FC = () => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
        <select
          value={config.generationProviders.text}
          onChange={(e) => dispatch(setGenerationProvider({ generationType: 'text', provider: e.target.value as AIProvider }))}
          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="gemini">Gemini</option>
          <option value="comfyui">ComfyUI</option>
        </select>
      </div>
    </div>
  );
};

export default TextGenSettingsTab;
