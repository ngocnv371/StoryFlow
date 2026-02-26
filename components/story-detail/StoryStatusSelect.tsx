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
      className={`w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${className}`}
    >
      <option value="Draft">Draft</option>
      <option value="Pending">Pending</option>
      <option value="Completed">Completed</option>
      <option value="Archived">Archived</option>
    </select>
  );
};

export default StoryStatusSelect;