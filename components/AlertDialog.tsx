
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { hideAlert } from '../store/uiSlice';

const AlertDialog: React.FC = () => {
  const dispatch = useDispatch();
  const { isOpen, title, message, type } = useSelector((state: RootState) => state.ui.alert);

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-500',
      btn: 'bg-emerald-600 hover:bg-emerald-700',
      svg: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-50',
      icon: 'text-red-500',
      btn: 'bg-red-600 hover:bg-red-700',
      svg: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-500',
      btn: 'bg-amber-600 hover:bg-amber-700',
      svg: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-500',
      btn: 'bg-indigo-600 hover:bg-indigo-700',
      svg: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  }[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-6 ${typeStyles.bg} flex justify-center`}>
          <div className={`p-3 bg-white rounded-2xl shadow-sm ${typeStyles.icon}`}>
            {typeStyles.svg}
          </div>
        </div>
        <div className="p-8 text-center space-y-3">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-slate-500 leading-relaxed line-clamp-6">{message}</p>
          <button 
            onClick={() => dispatch(hideAlert())}
            className={`w-full mt-6 py-3 px-4 text-white font-bold rounded-2xl transition-all shadow-lg ${typeStyles.btn}`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
