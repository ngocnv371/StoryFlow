
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Story } from '../types';
import { supabase } from '../supabaseClient';

interface StoriesState {
  items: Story[];
  loading: boolean;
  error: string | null;
  imageGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
  audioGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
  musicGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
  transcriptGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
  videoGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
}

export const fetchStories = createAsyncThunk('stories/fetchAll', async () => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Story[];
});

export const fetchStoryById = createAsyncThunk('stories/fetchById', async (id: string) => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Story | null;
});

export const createStoryRemote = createAsyncThunk('stories/create', async (userId: string) => {
  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: userId,
      title: 'Untitled Story',
      summary: 'A new story waiting to be told...',
      tags: ['draft'],
      status: 'Draft',
      thumbnail_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop',
      transcript: ''
    })
    .select();
  if (error) throw error;
  return data[0] as Story;
});

const makeIdeaTitle = (idea: string, index: number): string => {
  const cleaned = idea
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return `Idea Project ${index + 1}`;
  }

  const trimmed = cleaned.length > 60 ? `${cleaned.slice(0, 57).trimEnd()}...` : cleaned;
  return trimmed;
};

export const createStoriesFromIdeasRemote = createAsyncThunk(
  'stories/createFromIdeas',
  async ({ userId, ideas }: { userId: string; ideas: string[] }) => {
    const rows = ideas.map((idea, index) => ({
      user_id: userId,
      title: makeIdeaTitle(idea, index),
      summary: idea,
      tags: ['idea', 'draft'],
      status: 'Draft',
      thumbnail_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop',
      transcript: ''
    }));

    const { data, error } = await supabase
      .from('stories')
      .insert(rows)
      .select();

    if (error) throw error;
    return data as Story[];
  }
);

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
      audio_url: story.audio_url,
      duration: story.duration,
      music_url: story.music_url,
      video_url: story.video_url,
      narrator: story.narrator,
      cover_prompt: story.cover_prompt,
      music: story.music
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
  musicGenerationStatuses: {},
  transcriptGenerationStatuses: {},
  videoGenerationStatuses: {},
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
    setMusicGenStatus: (state, action: PayloadAction<{ id: string; status: 'idle' | 'generating' | 'error' }>) => {
      state.musicGenerationStatuses[action.payload.id] = action.payload.status;
    },
    setTranscriptGenStatus: (state, action: PayloadAction<{ id: string; status: 'idle' | 'generating' | 'error' }>) => {
      state.transcriptGenerationStatuses[action.payload.id] = action.payload.status;
    },
    setVideoGenStatus: (state, action: PayloadAction<{ id: string; status: 'idle' | 'generating' | 'error' }>) => {
      state.videoGenerationStatuses[action.payload.id] = action.payload.status;
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
      .addCase(fetchStoryById.fulfilled, (state, action) => {
        if (!action.payload) return;
        const index = state.items.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createStoryRemote.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(createStoriesFromIdeasRemote.fulfilled, (state, action) => {
        const createdStories = [...action.payload].reverse();
        state.items = [...createdStories, ...state.items];
      })
      .addCase(updateStoryRemote.fulfilled, (state, action) => {
        const index = state.items.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  }
});

export const { setImageGenStatus, setAudioGenStatus, setMusicGenStatus, setTranscriptGenStatus, setVideoGenStatus } = storiesSlice.actions;
export default storiesSlice.reducer;
