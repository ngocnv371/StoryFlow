
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showAlert } from '../store/uiSlice';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('ngocnv371@gmail.com');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isSignUp) {
      const { error } = await signUp(email, password, name);
      if (error) {
        setError(error.message);
      } else {
        dispatch(showAlert({
          title: 'Account Created',
          message: 'Please check your email for a confirmation link to activate your account.',
          type: 'success'
        }));
        setIsSignUp(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
      else navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-700">
        <div className="p-8 bg-indigo-600 text-white text-center">
          <h1 className="text-3xl font-bold">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="opacity-80 mt-2">{isSignUp ? 'Join StoryFlow today' : 'Log in to manage your stories'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
          
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full p-4 border rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 border rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 border rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          
          <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl transition-all">
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
          
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-indigo-600 text-sm font-bold hover:underline">
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
