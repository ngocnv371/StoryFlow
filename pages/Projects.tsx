
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchStories } from '../store/storiesSlice';

const Projects: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: stories, loading } = useSelector((state: RootState) => state.stories);

  useEffect(() => {
    dispatch(fetchStories());
  }, [dispatch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Your Projects</h1>
          <p className="text-slate-500">Manage and create immersive stories with AI.</p>
        </div>
      </div>

      {loading && stories.length === 0 ? (
        <div className="flex justify-center p-12 text-slate-400">Loading your stories...</div>
      ) : stories.length === 0 ? (
        <div className="text-center p-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <p className="text-slate-400 font-medium">No stories found. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stories.map((story) => (
            <Link key={story.id} to={`/projects/${story.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl transition-all flex flex-col">
              <div className="relative aspect-video overflow-hidden">
                <img src={story.thumbnail_url || 'https://via.placeholder.com/400x225'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={story.title} />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-2">{story.title}</h3>
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
