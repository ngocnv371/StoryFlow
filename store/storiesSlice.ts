
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Story } from '../types';
import { supabase } from '../supabaseClient';

interface StoriesState {
  items: Story[];
  loading: boolean;
  error: string | null;
  imageGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
  audioGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
}

export const fetchStories = createAsyncThunk('stories/fetchAll', async () => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Story[];
});

export const updateStoryRemote = createAsyncThunk('stories/update', async (story: Story) => {
  const { data, error } = await supabase
    .from('stories')
    .update({
      title: story.title,
      summary: story.summary,
      tags: story.tags,
      transcript: story.transcript,
      status: story.status,
      thumbnail_url: story.thumbnail_url,
      audio_url: story.audio_url
    })
    .eq('id', story.id)
    .select();
  if (error) throw error;
  return data[0] as Story;
});

const initialState: StoriesState = {
  items: [],
  loading: false,
  error: null,
  imageGenerationStatuses: {},
  audioGenerationStatuses: {},
};

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    setImageGenStatus: (state, action: PayloadAction<{ id: string; status: 'idle' | 'generating' | 'error' }>) => {
      state.imageGenerationStatuses[action.payload.id] = action.payload.status;
    },
    setAudioGenStatus: (state, action: PayloadAction<{ id: string; status: 'idle' | 'generating' | 'error' }>) => {
      state.audioGenerationStatuses[action.payload.id] = action.payload.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(updateStoryRemote.fulfilled, (state, action) => {
        const index = state.items.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  }
});

export const { setImageGenStatus, setAudioGenStatus } = storiesSlice.actions;
export default storiesSlice.reducer;
