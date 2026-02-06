
import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../store';
import { loadMore } from '../store/storiesSlice';

const Projects: React.FC = () => {
  const dispatch = useDispatch();
  const { items: stories, loading } = useSelector((state: RootState) => state.stories);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          dispatch(loadMore());
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loading, dispatch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Your Projects</h1>
          <p className="text-slate-500">Manage and create immersive stories with AI.</p>
        </div>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stories.map((story) => (
          <Link
            key={story.id}
            to={`/projects/${story.id}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={story.thumbnail}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                alt={story.title}
              />
              <div className="absolute top-3 left-3">
                 <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                    story.status === 'Completed' ? 'bg-emerald-500 text-white' :
                    story.status === 'Pending' ? 'bg-amber-500 text-white' :
                    'bg-slate-700 text-white'
                  }`}>
                    {story.status}
                  </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-2">{story.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                {story.summary || "No summary available for this story."}
              </p>
              <div className="flex flex-wrap gap-1 mt-auto">
                {story.tags.map(tag => (
                  <span key={tag} className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div ref={loaderRef} className="py-12 flex justify-center">
        {loading && (
          <div className="flex items-center gap-3 text-slate-400 font-medium">
            <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            Loading more stories...
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
