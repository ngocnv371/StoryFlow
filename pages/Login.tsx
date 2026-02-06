
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/');
    } else {
      setError('Invalid username or password (hint: admin/admin)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-10 duration-700">
        <div className="p-10 bg-indigo-600 text-white text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl mx-auto mb-4 shadow-xl">
            SF
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-indigo-100 opacity-80">Log in to manage your stories</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="e.g. admin"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-200"
          >
            Log In
          </button>
          
          <p className="text-center text-slate-400 text-sm">
            Default credentials: <span className="font-bold text-slate-600">admin / admin</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
