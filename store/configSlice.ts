
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppConfig, TextGenConfig, AudioGenConfig, ImageGenConfig } from '../types';

const STORAGE_KEY = 'storyflow_config';

const defaultState: AppConfig = {
  textGen: {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-3-flash-preview',
    endpoint: '',
  },
  audioGen: {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.5-flash-preview-tts',
  },
  imageGen: {
    provider: 'gemini',
    apiKey: '',
    endpoint: '',
  },
};

// Load config from localStorage if available
const loadConfigFromStorage = (): AppConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return {
        textGen: { ...defaultState.textGen, ...parsed.textGen },
        audioGen: { ...defaultState.audioGen, ...parsed.audioGen },
        imageGen: { ...defaultState.imageGen, ...parsed.imageGen },
      };
    }
  } catch (error) {
    console.error('Failed to load config from localStorage:', error);
  }
  return defaultState;
};

// Save config to localStorage
export const saveConfigToStorage = (config: AppConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save config to localStorage:', error);
  }
};

const initialState: AppConfig = loadConfigFromStorage();

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setTextGenConfig: (state, action: PayloadAction<Partial<TextGenConfig>>) => {
      state.textGen = { ...state.textGen, ...action.payload };
    },
    setAudioGenConfig: (state, action: PayloadAction<Partial<AudioGenConfig>>) => {
      state.audioGen = { ...state.audioGen, ...action.payload };
    },
    setImageGenConfig: (state, action: PayloadAction<Partial<ImageGenConfig>>) => {
      state.imageGen = { ...state.imageGen, ...action.payload };
    },
  },
});

export const { setTextGenConfig, setAudioGenConfig, setImageGenConfig } = configSlice.actions;
export default configSlice.reducer;
