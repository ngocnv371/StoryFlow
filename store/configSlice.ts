
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppConfig, GeminiConfig, ComfyConfig, AudioGenConfig, ImageGenConfig, AIProvider, GenerationType, YouTubeConfig } from '../types';

const STORAGE_KEY = 'storyflow_config';

const defaultState: AppConfig = {
  generationProviders: {
    text: 'gemini',
    image: 'gemini',
    narration: 'gemini',
    music: 'comfyui',
  },
  gemini: {
    apiKey: '',
    textModel: 'gemini-3-flash-preview',
    audioModel: 'gemini-2.5-flash-preview-tts',
    imageModel: 'gemini-2.5-flash-image',
  },
  comfy: {
    apiKey: '',
    endpoint: '',
    model: '',
  },
  audioGen: {
    voice: 'Kore',
    speed: 1,
  },
  imageGen: {
    width: 1280,
    height: 720,
    cfg: 7,
  },
  youtube: {
    clientId: '',
    privacyStatus: 'unlisted',
    accessToken: '',
    accessTokenExpiresAt: 0,
  },
};

// Load config from localStorage if available
const loadConfigFromStorage = (): AppConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const legacyProvider: AIProvider = parsed.provider ?? parsed.imageGen?.provider ?? defaultState.generationProviders.image;
      // Merge with defaults to ensure all fields exist
      return {
        generationProviders: {
          text: parsed.generationProviders?.text ?? parsed.textGen?.provider ?? defaultState.generationProviders.text,
          image: parsed.generationProviders?.image ?? legacyProvider,
          narration: parsed.generationProviders?.narration ?? parsed.audioGen?.provider ?? defaultState.generationProviders.narration,
          music: parsed.generationProviders?.music ?? parsed.musicGen?.provider ?? defaultState.generationProviders.music,
        },
        gemini: {
          ...defaultState.gemini,
          ...parsed.gemini,
          apiKey: parsed.gemini?.apiKey ?? parsed.textGen?.apiKey ?? parsed.audioGen?.apiKey ?? parsed.imageGen?.apiKey ?? defaultState.gemini.apiKey,
          textModel: parsed.gemini?.textModel ?? parsed.textGen?.model ?? defaultState.gemini.textModel,
          audioModel: parsed.gemini?.audioModel ?? parsed.audioGen?.model ?? defaultState.gemini.audioModel,
          imageModel: parsed.gemini?.imageModel ?? parsed.imageGen?.model ?? defaultState.gemini.imageModel,
        },
        comfy: {
          ...defaultState.comfy,
          ...parsed.comfy,
          apiKey: parsed.comfy?.apiKey ?? parsed.imageGen?.apiKey ?? defaultState.comfy.apiKey,
          endpoint: parsed.comfy?.endpoint ?? parsed.imageGen?.endpoint ?? defaultState.comfy.endpoint,
          model: parsed.comfy?.model ?? defaultState.comfy.model,
        },
        audioGen: { ...defaultState.audioGen, ...parsed.audioGen },
        imageGen: { ...defaultState.imageGen, ...parsed.imageGen },
        youtube: {
          ...defaultState.youtube,
          ...parsed.youtube,
        },
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
    setGenerationProvider: (state, action: PayloadAction<{ generationType: GenerationType; provider: AIProvider }>) => {
      state.generationProviders[action.payload.generationType] = action.payload.provider;
    },
    setGeminiConfig: (state, action: PayloadAction<Partial<GeminiConfig>>) => {
      state.gemini = { ...state.gemini, ...action.payload };
    },
    setComfyConfig: (state, action: PayloadAction<Partial<ComfyConfig>>) => {
      state.comfy = { ...state.comfy, ...action.payload };
    },
    setAudioGenConfig: (state, action: PayloadAction<Partial<AudioGenConfig>>) => {
      state.audioGen = { ...state.audioGen, ...action.payload };
    },
    setImageGenConfig: (state, action: PayloadAction<Partial<ImageGenConfig>>) => {
      state.imageGen = { ...state.imageGen, ...action.payload };
    },
    setYouTubeConfig: (state, action: PayloadAction<Partial<YouTubeConfig>>) => {
      state.youtube = { ...state.youtube, ...action.payload };
    },
  },
});

export const { setGenerationProvider, setGeminiConfig, setComfyConfig, setAudioGenConfig, setImageGenConfig, setYouTubeConfig } = configSlice.actions;
export default configSlice.reducer;
