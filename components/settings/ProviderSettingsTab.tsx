import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setComfyConfig, setGeminiConfig } from '../../store/configSlice';

const ProviderSettingsTab: React.FC = () => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-800">Gemini</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key</label>
          <input
            type="password"
            value={config.gemini.apiKey}
            placeholder="Enter your Gemini API key"
            onChange={(e) => dispatch(setGeminiConfig({ apiKey: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Text Model Name</label>
          <input
            type="text"
            value={config.gemini.textModel}
            placeholder="gemini-3-flash-preview"
            onChange={(e) => dispatch(setGeminiConfig({ textModel: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Audio Model Name</label>
          <input
            type="text"
            value={config.gemini.audioModel}
            placeholder="gemini-2.5-flash-preview-tts"
            onChange={(e) => dispatch(setGeminiConfig({ audioModel: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Image Model Name</label>
          <input
            type="text"
            value={config.gemini.imageModel}
            placeholder="gemini-2.5-flash-image"
            onChange={(e) => dispatch(setGeminiConfig({ imageModel: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-800">ComfyUI</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ComfyUI URL</label>
          <input
            type="text"
            value={config.comfy.endpoint}
            placeholder="http://127.0.0.1:8188/prompt"
            onChange={(e) => dispatch(setComfyConfig({ endpoint: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ComfyUI API Key</label>
          <input
            type="password"
            value={config.comfy.apiKey}
            placeholder="Enter your ComfyUI API token"
            onChange={(e) => dispatch(setComfyConfig({ apiKey: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ComfyUI Model</label>
          <input
            type="text"
            value={config.comfy.model || ''}
            placeholder="Optional ComfyUI model name"
            onChange={(e) => dispatch(setComfyConfig({ model: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ProviderSettingsTab;
