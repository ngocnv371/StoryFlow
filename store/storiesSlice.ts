
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Story } from '../types';

interface StoriesState {
  items: Story[];
  loading: boolean;
  page: number;
  // Track generation status per story ID: 'idle' | 'generating' | 'error'
  imageGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
}

const generateMockStories = (count: number, startId: number): Story[] => {
  const statuses: ('Draft' | 'Pending' | 'Completed')[] = ['Draft', 'Pending', 'Completed'];
  return Array.from({ length: count }, (_, i) => ({
    id: (startId + i).toString(),
    title: `Amazing Story Part ${startId + i}`,
    summary: `This is a compelling summary for story ${startId + i}. It explores deep themes and interesting characters.`,
    tags: ['fiction', 'adventure', 'scifi'],
    transcript: '',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date().toISOString(),
    thumbnail: `https://picsum.photos/seed/${startId + i}/400/225`,
  }));
};

const initialState: StoriesState = {
  items: generateMockStories(12, 1),
  loading: false,
  page: 1,
  imageGenerationStatuses: {},
};

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    updateStory: (state, action: PayloadAction<Story>) => {
      const index = state.items.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    updateStoryThumbnail: (state, action: PayloadAction<{ id: string; thumbnail: string }>) => {
      const story = state.items.find(s => s.id === action.payload.id);
      if (story) {
        story.thumbnail = action.payload.thumbnail;
      }
    },
    setImageGenStatus: (state, action: PayloadAction<{ id: string; status: 'idle' | 'generating' | 'error' }>) => {
      state.imageGenerationStatuses[action.payload.id] = action.payload.status;
    },
    loadMore: (state) => {
      state.loading = true;
      const newItems = generateMockStories(8, state.items.length + 1);
      state.items = [...state.items, ...newItems];
      state.page += 1;
      state.loading = false;
    },
  },
});

export const { updateStory, updateStoryThumbnail, setImageGenStatus, loadMore } = storiesSlice.actions;
export default storiesSlice.reducer;
