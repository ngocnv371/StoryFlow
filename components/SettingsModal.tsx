
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setProvider, setGeminiConfig, setComfyConfig, setAudioGenConfig, setImageGenConfig } from '../store/configSlice';
import { AIProvider } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);
  const [activeTab, setActiveTab] = useState<'provider' | 'audio' | 'image'>('provider');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">System Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('provider')}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'provider' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Provider
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'audio' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Audio
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'image' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Image
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'provider' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                <select
                  value={config.provider}
                  onChange={(e) => dispatch(setProvider(e.target.value as AIProvider))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="gemini">Gemini</option>
                  <option value="comfyui">ComfyUI</option>
                </select>
              </div>

              {config.provider === 'gemini' ? (
                <>
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
                </>
              ) : (
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

              )}

              {config.provider === 'comfyui' && (
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
              )}
            </div>
          ) : activeTab === 'audio' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Voice</label>
                <input
                  type="text"
                  value={config.audioGen.voice || ''}
                  placeholder="Kore"
                  onChange={(e) => dispatch(setAudioGenConfig({ voice: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
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
          ) : (
            <div className="space-y-4">
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
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
