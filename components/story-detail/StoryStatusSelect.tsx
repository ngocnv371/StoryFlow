import React from 'react';
import { Story } from '../../types';

interface StoryStatusSelectProps {
  value: Story['status'];
  onChange: (status: Story['status']) => void;
  className?: string;
}

const StoryStatusSelect: React.FC<StoryStatusSelectProps> = ({ value, onChange, className = '' }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Story['status'])}
      className={`w-full px-3 py-2 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${className}`}
    >
      <option value="draft">Draft</option>
      <option value="pending">Pending</option>
      <option value="ready">Ready</option>
      <option value="processing">Processing</option>
      <option value="failed">Failed</option>
      <option value="done">Done</option>
      <option value="archived">Archived</option>
    </select>
  );
};

export default StoryStatusSelect;