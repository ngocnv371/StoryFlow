
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateStory } from '../store/storiesSlice';
import { generateStoryTranscript } from '../services/geminiService';
import { Story } from '../types';
import CoverGenerator from '../components/CoverGenerator';
import ImageInspector from '../components/ImageInspector';

const StoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const story = useSelector((state: RootState) => state.stories.items.find(s => s.id === id));
  const textGenConfig = useSelector((state: RootState) => state.config.textGen);

  const [formData, setFormData] = useState<Story | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  useEffect(() => {
    if (story) {
      setFormData(story);
    }
  }, [story]);

  if (!formData) return <div className="p-8">Loading...</div>;

  const handleSave = () => {
    setSaveStatus('saving');
    dispatch(updateStory(formData));
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleGenerateTranscript = async () => {
    if (!formData.title || !formData.summary) {
      alert("Please provide at least a title and summary to generate a transcript.");
      return;
    }

    setIsGenerating(true);
    try {
      const transcript = await generateStoryTranscript(textGenConfig, {
        title: formData.title,
        summary: formData.summary,
        tags: formData.tags,
      });
      setFormData(prev => prev ? ({ ...prev, transcript }) : null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = e.currentTarget.value.trim();
      if (value && !formData.tags.includes(value)) {
        setFormData({ ...formData, tags: [...formData.tags, value] });
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tag: string) => {
    if (!formData) return;
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Projects
        </button>
        <div className="flex items-center gap-3">
          <span className={`text-sm transition-opacity duration-300 ${saveStatus === 'saved' ? 'opacity-100' : 'opacity-0'} text-emerald-600 font-medium`}>
            All changes saved!
          </span>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Progress'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
             <div 
               onClick={() => setIsInspectorOpen(true)}
               className="aspect-video rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative group cursor-pointer hover:shadow-lg transition-all duration-300"
             >
                <img 
                  src={formData.thumbnail} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  alt="Cover" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                   </div>
                </div>
             </div>

             <CoverGenerator story={formData} />

             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                />
             </div>

             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Summary</label>
                <textarea
                  rows={4}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                />
             </div>

             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-xs font-bold">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type tag & press Enter"
                  onKeyDown={addTag}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
             </div>

             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Completed">Completed</option>
                </select>
             </div>
          </div>
        </div>

        {/* Right Column - Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Story Transcript
              </h3>
              <button
                onClick={handleGenerateTranscript}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                  isGenerating ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {isGenerating ? (
                   <>
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    Thinking...
                   </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                    Generate AI Transcript
                  </>
                )}
              </button>
            </div>
            <textarea
              value={formData.transcript}
              onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
              placeholder="Start writing your story transcript here or use the AI generator above..."
              className="flex-1 p-8 text-lg text-slate-700 leading-relaxed outline-none resize-none bg-white font-serif"
            />
          </div>
        </div>
      </div>

      <ImageInspector 
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        imageUrl={formData.thumbnail}
        title={formData.title}
      />
    </div>
  );
};

export default StoryDetail;
