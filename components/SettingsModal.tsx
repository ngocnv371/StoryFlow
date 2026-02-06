
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setTextGenConfig, setAudioGenConfig } from '../store/configSlice';
import { TextGenProvider, AudioGenProvider } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);
  const [activeTab, setActiveTab] = useState<'text' | 'audio'>('text');

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
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'text' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Text Generation
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'audio' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Audio Generation
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'text' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                <select
                  value={config.textGen.provider}
                  onChange={(e) => dispatch(setTextGenConfig({ provider: e.target.value as TextGenProvider }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="gemini">Google Gemini (Recommended)</option>
                  <option value="openai">OpenAI Compatible Service</option>
                </select>
              </div>

              {config.textGen.provider === 'openai' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Base Endpoint</label>
                  <input
                    type="text"
                    value={config.textGen.endpoint}
                    placeholder="https://api.openai.com/v1"
                    onChange={(e) => dispatch(setTextGenConfig({ endpoint: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={config.textGen.apiKey}
                  placeholder="Enter your API key"
                  onChange={(e) => dispatch(setTextGenConfig({ apiKey: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                <input
                  type="text"
                  value={config.textGen.model}
                  placeholder={config.textGen.provider === 'gemini' ? 'gemini-3-flash-preview' : 'gpt-4o'}
                  onChange={(e) => dispatch(setTextGenConfig({ model: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                <select
                  value={config.audioGen.provider}
                  onChange={(e) => dispatch(setAudioGenConfig({ provider: e.target.value as AudioGenProvider }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="gemini">Google Gemini TTS</option>
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="whisper">OpenAI Whisper (STT)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={config.audioGen.apiKey}
                  placeholder="Enter provider API key"
                  onChange={(e) => dispatch(setAudioGenConfig({ apiKey: e.target.value }))}
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
