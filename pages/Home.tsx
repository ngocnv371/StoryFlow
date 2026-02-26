
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { createStoryRemote, fetchStories } from '../store/storiesSlice';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: stories, loading } = useSelector((state: RootState) => state.stories);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!loading && stories.length === 0) {
      dispatch(fetchStories());
    }
  }, [dispatch, loading, stories.length]);
  
  const stats = [
    { label: 'Total Stories', value: stories.length, icon: '📚', color: 'bg-blue-500' },
    { label: 'Pending Review', value: stories.filter(s => s.status === 'Pending').length, icon: '⏳', color: 'bg-amber-500' },
    { label: 'Drafts', value: stories.filter(s => s.status === 'Draft').length, icon: '✍️', color: 'bg-indigo-500' },
    { label: 'Completed', value: stories.filter(s => s.status === 'Completed').length, icon: '✅', color: 'bg-emerald-500' },
  ];

  const chartData = [
    { name: 'Draft', count: stories.filter(s => s.status === 'Draft').length, color: '#6366f1' },
    { name: 'Pending', count: stories.filter(s => s.status === 'Pending').length, color: '#f59e0b' },
    { name: 'Completed', count: stories.filter(s => s.status === 'Completed').length, color: '#10b981' },
  ];

  const handleCreateNew = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const resultAction = await dispatch(createStoryRemote(user.id));
      if (createStoryRemote.fulfilled.match(resultAction)) {
        navigate(`/projects/${resultAction.payload.id}`);
      }
    } catch (error: any) {
      toast.error('Could not start a new project.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
          <p className="text-slate-500 mt-1">Here's an overview of your storytelling workflow.</p>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={isCreating}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md ${
            isCreating 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isCreating ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          )}
          <span>Start New Story</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} text-white text-2xl flex items-center justify-center rounded-xl shadow-lg`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Workflow Distribution</h3>
            <div className="flex gap-4">
               {chartData.map(d => (
                 <div key={d.name} className="flex items-center gap-1.5">
                   <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                   <span className="text-xs text-slate-500 font-medium">{d.name}</span>
                 </div>
               ))}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="space-y-4 flex-1">
            {stories.length > 0 ? (
              stories.slice(0, 5).map(story => (
                <div key={story.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${story.id}`)}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                    <img src={story.thumbnail_url} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{story.title}</p>
                    <p className="text-xs text-slate-500">{new Date(story.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                    story.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                    story.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {story.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
                <p className="text-sm italic">No recent activity</p>
              </div>
            )}
          </div>
          {stories.length > 5 && (
            <button onClick={() => navigate('/projects')} className="mt-4 text-center text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors py-2 border-t">
              View All Projects
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
