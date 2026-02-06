
import React, { useState, KeyboardEvent } from 'react';

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const TagEditor: React.FC<TagEditorProps> = ({ tags, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === ',' || e.key === ' ') {
      // Commas or spaces can also trigger tag creation
      if (inputValue.trim()) {
        e.preventDefault();
        addTag();
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Story Tags</label>
      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
        {tags.map((tag) => (
          <span 
            key={tag} 
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg group animate-in zoom-in-90 duration-200"
          >
            #{tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-indigo-900 focus:outline-none transition-colors"
              title="Remove tag"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "Add tags (Sci-Fi, Mystery...)" : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>
      <p className="text-[10px] text-slate-400 italic">Press Enter or comma to add tags.</p>
    </div>
  );
};

export default TagEditor;
