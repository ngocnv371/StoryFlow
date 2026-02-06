
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Home: React.FC = () => {
  const stories = useSelector((state: RootState) => state.stories.items);
  
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
          <p className="text-slate-500 mt-1">Here's an overview of your storytelling workflow.</p>
        </div>
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
          <h3 className="text-lg font-bold text-slate-800 mb-6">Workflow Distribution</h3>
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {stories.slice(0, 5).map(story => (
              <div key={story.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={story.thumbnail} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{story.title}</p>
                  <p className="text-xs text-slate-500">{new Date(story.createdAt).toLocaleDateString()}</p>
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                  story.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                  story.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {story.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
