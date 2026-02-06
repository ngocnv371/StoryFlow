
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchStories, createStoryRemote } from '../store/storiesSlice';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../store/uiSlice';

const Projects: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: stories, loading } = useSelector((state: RootState) => state.stories);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchStories());
  }, [dispatch]);

  const handleCreateNew = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const resultAction = await dispatch(createStoryRemote(user.id));
      if (createStoryRemote.fulfilled.match(resultAction)) {
        navigate(`/projects/${resultAction.payload.id}`);
      }
    } catch (error: any) {
      dispatch(showAlert({
        title: 'Creation Failed',
        message: 'Unable to create a new story at this time.',
        type: 'error'
      }));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Your Projects</h1>
          <p className="text-slate-500">Manage and create immersive stories with AI.</p>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={isCreating}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
            isCreating 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-200 hover:-translate-y-0.5'
          }`}
        >
          {isCreating ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
          <span>New Project</span>
        </button>
      </div>

      {loading && stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Loading your stories...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center p-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <p className="text-slate-400 font-medium mb-4">No stories found. Start your journey today!</p>
          <button onClick={handleCreateNew} className="text-indigo-600 font-bold hover:underline">Create your first story</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stories.map((story) => (
            <Link key={story.id} to={`/projects/${story.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl transition-all flex flex-col">
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img src={story.thumbnail_url || 'https://via.placeholder.com/400x225'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={story.title} />
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm ${
                    story.status === 'Completed' ? 'bg-emerald-500 text-white' :
                    story.status === 'Pending' ? 'bg-amber-500 text-white' :
                    'bg-slate-700/80 text-white backdrop-blur-sm'
                  }`}>
                    {story.status}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{story.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{story.summary}</p>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {story.tags.map(tag => (
                    <span key={tag} className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold">#{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
