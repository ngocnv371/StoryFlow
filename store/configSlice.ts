
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppConfig, GeminiConfig, ComfyConfig, OpenAICompatibleConfig, ChatterboxConfig, KokoroConfig, AudioGenConfig, ImageGenConfig, AIProvider, GenerationType, YouTubeConfig, VideoGenConfig } from '../types';
import { DEFAULT_GEMINI_STANDARD_ASPECT_RATIO, deriveGeminiStandardAspectRatio, isGeminiStandardAspectRatio } from '../constants';

const STORAGE_KEY = 'storyflow_config';

const resolveImageAspectRatio = (parsed: any) => {
  const storedRatio = parsed?.imageGen?.aspectRatio;
  if (isGeminiStandardAspectRatio(storedRatio)) {
    return storedRatio;
  }
  return deriveGeminiStandardAspectRatio(parsed?.imageGen?.width, parsed?.imageGen?.height);
};

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
  openAICompatible: {
    url: '',
    token: '',
  },
  chatterbox: {
    endpoint: '',
    token: '',
    model: '',
  },
  kokoro: {
    endpoint: 'http://localhost:5000/predictions',
    token: '',
  },
  audioGen: {
    voice: 'Kore',
    speed: 1,
  },
  imageGen: {
    aspectRatio: DEFAULT_GEMINI_STANDARD_ASPECT_RATIO,
    width: 1280,
    height: 720,
    cfg: 7,
  },
  video: {
    enableKenBurns: true,
    enableParticles: true,
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
          text: (() => {
            const provider = parsed.generationProviders?.text ?? parsed.textGen?.provider ?? defaultState.generationProviders.text;
            if (provider === 'openai-compatible' || provider === 'gemini' || provider === 'comfyui') {
              return provider;
            }
            return defaultState.generationProviders.text;
          })(),
          image: (() => {
            const provider = parsed.generationProviders?.image ?? legacyProvider;
            if (provider === 'gemini' || provider === 'comfyui') {
              return provider;
            }
            return defaultState.generationProviders.image;
          })(),
          narration: (() => {
            const provider = parsed.generationProviders?.narration ?? parsed.audioGen?.provider ?? defaultState.generationProviders.narration;
            if (provider === 'gemini' || provider === 'comfyui' || provider === 'chatterbox' || provider === 'kokoro') {
              return provider;
            }
            return defaultState.generationProviders.narration;
          })(),
          music: (() => {
            const provider = parsed.generationProviders?.music ?? parsed.musicGen?.provider ?? defaultState.generationProviders.music;
            if (provider === 'gemini' || provider === 'comfyui') {
              return provider;
            }
            return defaultState.generationProviders.music;
          })(),
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
        openAICompatible: {
          ...defaultState.openAICompatible,
          ...parsed.openAICompatible,
          url: parsed.openAICompatible?.url ?? defaultState.openAICompatible.url,
          token: parsed.openAICompatible?.token ?? defaultState.openAICompatible.token,
        },
        chatterbox: {
          ...defaultState.chatterbox,
          ...parsed.chatterbox,
          endpoint: parsed.chatterbox?.endpoint ?? defaultState.chatterbox.endpoint,
          token: parsed.chatterbox?.token ?? defaultState.chatterbox.token,
          model: parsed.chatterbox?.model ?? defaultState.chatterbox.model,
        },
        kokoro: {
          ...defaultState.kokoro,
          ...parsed.kokoro,
          endpoint: parsed.kokoro?.endpoint ?? defaultState.kokoro.endpoint,
          token: parsed.kokoro?.token ?? defaultState.kokoro.token,
        },
        audioGen: { ...defaultState.audioGen, ...parsed.audioGen },
        imageGen: {
          ...defaultState.imageGen,
          ...parsed.imageGen,
          aspectRatio: resolveImageAspectRatio(parsed),
        },
        video: { ...defaultState.video, ...parsed.video },
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
      if (action.payload.provider === 'openai-compatible' && action.payload.generationType !== 'text') {
        return;
      }
      if (action.payload.provider === 'chatterbox' && action.payload.generationType !== 'narration') {
        return;
      }
      if (action.payload.provider === 'kokoro' && action.payload.generationType !== 'narration') {
        return;
      }
      state.generationProviders[action.payload.generationType] = action.payload.provider;
    },
    setGeminiConfig: (state, action: PayloadAction<Partial<GeminiConfig>>) => {
      state.gemini = { ...state.gemini, ...action.payload };
    },
    setComfyConfig: (state, action: PayloadAction<Partial<ComfyConfig>>) => {
      state.comfy = { ...state.comfy, ...action.payload };
    },
    setOpenAICompatibleConfig: (state, action: PayloadAction<Partial<OpenAICompatibleConfig>>) => {
      state.openAICompatible = { ...state.openAICompatible, ...action.payload };
    },
    setChatterboxConfig: (state, action: PayloadAction<Partial<ChatterboxConfig>>) => {
      state.chatterbox = { ...state.chatterbox, ...action.payload };
    },
    setKokoroConfig: (state, action: PayloadAction<Partial<KokoroConfig>>) => {
      state.kokoro = { ...state.kokoro, ...action.payload };
    },
    setAudioGenConfig: (state, action: PayloadAction<Partial<AudioGenConfig>>) => {
      state.audioGen = { ...state.audioGen, ...action.payload };
    },
    setImageGenConfig: (state, action: PayloadAction<Partial<ImageGenConfig>>) => {
      state.imageGen = { ...state.imageGen, ...action.payload };
    },
    setVideoGenConfig: (state, action: PayloadAction<Partial<VideoGenConfig>>) => {
      state.video = { ...state.video, ...action.payload };
    },
    setYouTubeConfig: (state, action: PayloadAction<Partial<YouTubeConfig>>) => {
      state.youtube = { ...state.youtube, ...action.payload };
    },
  },
});

export const { setGenerationProvider, setGeminiConfig, setComfyConfig, setOpenAICompatibleConfig, setChatterboxConfig, setKokoroConfig, setAudioGenConfig, setImageGenConfig, setVideoGenConfig, setYouTubeConfig } = configSlice.actions;
export default configSlice.reducer;
