import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setAudioGenConfig, setGenerationProvider } from '../../store/configSlice';
import { AIProvider } from '../../types';

const NarrationGenSettingsTab: React.FC = () => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
        <select
          value={config.generationProviders.narration}
          onChange={(e) => dispatch(setGenerationProvider({ generationType: 'narration', provider: e.target.value as AIProvider }))}
          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="gemini">Gemini</option>
          <option value="comfyui">ComfyUI</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Voice</label>
        <input
          type="text"
          value={config.audioGen.voice || ''}
          placeholder="Kore"
          onChange={(e) => dispatch(setAudioGenConfig({ voice: e.target.value }))}
          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <a
          href="https://docs.cloud.google.com/text-to-speech/docs/gemini-tts#voice_options"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          View Gemini TTS voice options
        </a>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Speed</label>
        <input
          type="number"
          min="0.5"
          max="2"
          step="0.1"
          value={config.audioGen.speed ?? 1}
          onChange={(e) => {
            const speed = Number.parseFloat(e.target.value);
            dispatch(setAudioGenConfig({ speed: Number.isNaN(speed) ? 1 : speed }));
          }}
          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );
};

export default NarrationGenSettingsTab;
