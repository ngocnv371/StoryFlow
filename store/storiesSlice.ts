
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AppConfig, Story, StoryRow } from '../types';
import { supabase } from '../supabaseClient';
import {
  buildStoryGenerationOverridesFromConfig,
  buildStoryGenerationOverridesSnapshot,
  createStoryDraft,
  normalizeStoryRow,
  serializeStoryMetadata,
  withStoryGenerationOverrides,
} from '../services/storyMetadata';

interface StoriesState {
  items: Story[];
  loading: boolean;
  error: string | null;
  projectIdeasGenerating: boolean;
  imageGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
  audioGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
  musicGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
  transcriptGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
  videoGenerationStatuses: Record<string, 'idle' | 'generating' | 'error'>;
}

const storyListSelect = `
  id,
  user_id,
  title,
  metadata,
  tags,
  status,
  created_at
`;

const storyDetailSelect = storyListSelect;

const countWords = (text: string): number => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};

export const fetchStories = createAsyncThunk('stories/fetchAll', async () => {
  const { data, error } = await supabase
    .from('projects')
    .select(storyListSelect)
    .eq('type', 'story')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as StoryRow[]).map(normalizeStoryRow);
});

export const fetchStoryById = createAsyncThunk('stories/fetchById', async (id: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select(storyDetailSelect)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeStoryRow(data as StoryRow) : null;
});

export const createStoryRemote = createAsyncThunk('stories/create', async (userId: string, thunkApi) => {
  const state = thunkApi.getState() as { config: AppConfig };
  const generationOverrides = buildStoryGenerationOverridesFromConfig(state.config);

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title: 'Untitled Story',
      tags: ['draft'],
      type: 'story',
      status: 'draft',
      metadata: createStoryDraft({
        summary: 'A new story waiting to be told...',
        generationOverrides,
      }),
    })
    .select(storyDetailSelect);
  if (error) throw error;
  return normalizeStoryRow(data[0] as StoryRow);
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
  async ({ userId, ideas }: { userId: string; ideas: string[] }, thunkApi) => {
    const state = thunkApi.getState() as { config: AppConfig };
    const generationOverrides = buildStoryGenerationOverridesFromConfig(state.config);

    const rows = ideas.map((idea, index) => ({
      user_id: userId,
      title: makeIdeaTitle(idea, index),
      type: 'story',
      tags: ['idea', 'draft'],
      status: 'draft',
      metadata: createStoryDraft({
        summary: idea,
        generationOverrides,
      }),
    }));

    const { data, error } = await supabase
      .from('projects')
      .insert(rows)
      .select(storyDetailSelect);

    if (error) throw error;
    return (data as StoryRow[]).map(normalizeStoryRow);
  }
);

const performStoryUpdate = async (story: Story, config: AppConfig): Promise<Story> => {
  const generationOverrides = buildStoryGenerationOverridesSnapshot(config, story);
  const metadataWithOverrides = withStoryGenerationOverrides(story, generationOverrides);
  const hasTranscript = typeof story.transcript === 'string';
  const transcript = hasTranscript ? story.transcript : '';
  const word_count = hasTranscript ? countWords(transcript) : (story.word_count ?? 0);
  const metadata = serializeStoryMetadata({
    ...story,
    metadata: metadataWithOverrides,
    transcript,
    word_count,
  });

  const payload: Record<string, unknown> = {
    title: story.title,
    tags: story.tags,
    status: story.status,
    metadata,
  };

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', story.id)
    .select(storyDetailSelect);
  if (error) throw error;
  return normalizeStoryRow(data[0] as StoryRow);
};

export const updateStoryRemote = createAsyncThunk('stories/update', async (story: Story, thunkApi) => {
  const state = thunkApi.getState() as { config: AppConfig };
  return performStoryUpdate(story, state.config);
});

export const patchStoryRemote = createAsyncThunk('stories/patch', async (patch: Partial<Story> & { id: string }, thunkApi) => {
  const state = thunkApi.getState() as { stories: StoriesState; config: AppConfig };
  const currentStory = state.stories.items.find(s => s.id === patch.id);
  if (!currentStory) throw new Error('Story not found');
  return performStoryUpdate({ ...currentStory, ...patch }, state.config);
});

const initialState: StoriesState = {
  items: [],
  loading: false,
  error: null,
  projectIdeasGenerating: false,
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
    setProjectIdeasGenerating: (state, action: PayloadAction<boolean>) => {
      state.projectIdeasGenerating = action.payload;
    },
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
      })
      .addCase(patchStoryRemote.fulfilled, (state, action) => {
        const index = state.items.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  }
});

export const {
  setProjectIdeasGenerating,
  setImageGenStatus,
  setAudioGenStatus,
  setMusicGenStatus,
  setTranscriptGenStatus,
  setVideoGenStatus,
} = storiesSlice.actions;
export default storiesSlice.reducer;
