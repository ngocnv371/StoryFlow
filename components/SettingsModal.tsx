
import React, { useState } from 'react';
import ProviderSettingsTab from './settings/ProviderSettingsTab';
import TextGenSettingsTab from './settings/TextGenSettingsTab';
import ImageGenSettingsTab from './settings/ImageGenSettingsTab';
import NarrationGenSettingsTab from './settings/NarrationGenSettingsTab';
import MusicGenSettingsTab from './settings/MusicGenSettingsTab';
import VideoGenSettingsTab from './settings/VideoGenSettingsTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'provider' | 'text' | 'image' | 'narration' | 'music' | 'video'>('provider');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh] max-h-[85vh]">
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
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'text' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Text Gen
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'image' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Image Gen
          </button>
          <button
            onClick={() => setActiveTab('narration')}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'narration' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Narration Gen
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'music' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Music Gen
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'video' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Video Gen
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
          {activeTab === 'provider' && <ProviderSettingsTab />}
          {activeTab === 'text' && <TextGenSettingsTab />}
          {activeTab === 'image' && <ImageGenSettingsTab />}
          {activeTab === 'narration' && <NarrationGenSettingsTab />}
          {activeTab === 'music' && <MusicGenSettingsTab />}
          {activeTab === 'video' && <VideoGenSettingsTab />}
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
