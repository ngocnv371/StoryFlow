import React from 'react';
import TagEditor from '../TagEditor';

interface TagsSectionProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const TagsSection: React.FC<TagsSectionProps> = ({ tags, onChange }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800">Tags</h3>
      <TagEditor tags={tags} onChange={onChange} />
    </div>
  );
};

export default TagsSection;
