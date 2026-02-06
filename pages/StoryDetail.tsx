
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { updateStoryRemote } from '../store/storiesSlice';
import { Story } from '../types';
import CoverGenerator from '../components/CoverGenerator';
import AudioGenerator from '../components/AudioGenerator';
import TranscriptGenerator from '../components/TranscriptGenerator';
import ImageInspector from '../components/ImageInspector';
import TagEditor from '../components/TagEditor';

const StoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const story = useSelector((state: RootState) => state.stories.items.find(s => s.id === id));

  const [formData, setFormData] = useState<Story | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  useEffect(() => {
    if (story) setFormData(story);
  }, [story]);

  if (!formData) return <div className="p-8">Loading Story...</div>;

  const handleSave = async () => {
    setSaveStatus('saving');
    await dispatch(updateStoryRemote(formData));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/projects')} className="text-slate-500 hover:text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back
        </button>
        <div className="flex items-center gap-4">
          <span className={`text-sm text-emerald-600 font-medium transition-opacity ${saveStatus === 'saved' ? 'opacity-100' : 'opacity-0'}`}>Saved!</span>
          <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Save</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <div onClick={() => setIsInspectorOpen(true)} className="aspect-video rounded-xl overflow-hidden cursor-pointer group relative">
              <img src={formData.thumbnail_url || 'https://via.placeholder.com/400x225?text=No+Cover'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Story Cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
            
            <CoverGenerator story={formData} />
            <AudioGenerator story={formData} />

            {formData.audio_url && (
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border">
                <p className="text-xs font-bold text-slate-400 uppercase">Current Narration</p>
                <audio controls className="w-full h-10" src={formData.audio_url}></audio>
              </div>
            )}

            <div className="space-y-4 pt-2 border-t">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Title</label>
                <input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full p-3 border rounded-xl bg-slate-50 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
              
              <TagEditor 
                tags={formData.tags} 
                onChange={(tags) => setFormData({ ...formData, tags })} 
              />

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary</label>
                <textarea 
                  rows={4} 
                  value={formData.summary} 
                  onChange={e => setFormData({...formData, summary: e.target.value})} 
                  className="w-full p-3 border rounded-xl bg-slate-50 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border shadow-sm h-[700px] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <h3 className="font-bold text-slate-800">Transcript Editor</h3>
              </div>
              <TranscriptGenerator 
                story={formData} 
                onGenerated={(transcript) => setFormData(prev => prev ? ({ ...prev, transcript }) : null)} 
              />
            </div>
            <textarea 
              value={formData.transcript} 
              onChange={e => setFormData({...formData, transcript: e.target.value})} 
              className="flex-1 p-8 text-lg text-slate-700 leading-relaxed outline-none resize-none bg-white font-serif"
              placeholder="Tell your story here, or use the Magic Transcript button to generate a draft based on your summary..." 
            />
          </div>
        </div>
      </div>
      <ImageInspector isOpen={isInspectorOpen} onClose={() => setIsInspectorOpen(false)} imageUrl={formData.thumbnail_url} title={formData.title} />
    </div>
  );
};

export default StoryDetail;
