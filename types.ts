
import type { GeminiStandardAspectRatio } from './constants';

export type StoryStatus = 'draft' | 'pending' | 'ready' | 'processing' | 'failed' | 'done' | 'archived';

export interface Story {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  metadata?: StoryMetadata;
  tags: string[];
  transcript?: string;
  word_count: number;
  cover_prompt?: string;
  narrator?: string;
  music?: string;
  status: StoryStatus;
  created_at: string;
  thumbnail_url: string;
  audio_url?: string;
  duration?: number;
  music_url?: string;
  video_url?: string;
}

export interface StoryRow {
  id: string;
  user_id: string;
  title: string;
  status: StoryStatus;
  tags: string[] | null;
  metadata?: StoryMetadata | null;
  created_at: string;
}

export interface StoryGenerationOverrides {
  cover?: Pick<ImageGenConfig, 'aspectRatio'>;
  narration?: Pick<AudioGenConfig, 'voice' | 'speed'>;
  video?: Partial<VideoGenConfig>;
}

export type StoryTranscriptForm = 'long' | 'short';

export interface StoryMetadata {
  summary?: string;
  transcript?: string;
  word_count?: number;
  transcript_form?: StoryTranscriptForm;
  cover_prompt?: string;
  narrator?: string;
  music?: string;
  thumbnail_url?: string;
  audio_url?: string;
  duration?: number;
  music_url?: string;
  video_url?: string;
  image_prompts?: string[];
  image_urls?: string[];
  selected_cover_image_index?: number;
  generationOverrides?: StoryGenerationOverrides;
  [key: string]: unknown;
}

export type AIProvider = 'gemini' | 'comfyui' | 'openai-compatible' | 'chatterbox' | 'kokoro';
export type GenerationType = 'text' | 'image' | 'narration' | 'music';

export interface GenerationProviders {
  text: AIProvider;
  image: AIProvider;
  narration: AIProvider;
  music: AIProvider;
}

export interface GeminiConfig {
  apiKey: string;
  textModel: string;
  audioModel: string;
  imageModel: string;
}

export interface ComfyConfig {
  apiKey: string;
  endpoint?: string;
  model?: string;
}

export interface OpenAICompatibleConfig {
  url: string;
  token: string;
}

export interface ChatterboxConfig {
  endpoint: string;
  token: string;
  model: string;
}

export interface KokoroConfig {
  endpoint: string;
  token: string;
}

export interface AudioGenConfig {
  voice?: string;
  speed?: number;
}

export interface ImageGenConfig {
  aspectRatio?: GeminiStandardAspectRatio;
  width?: number;
  height?: number;
  cfg?: number;
}

export interface YouTubeConfig {
  clientId: string;
  privacyStatus: 'private' | 'public' | 'unlisted';
  accessToken?: string;
  accessTokenExpiresAt?: number;
}

export interface VideoGenConfig {
  enableKenBurns: boolean;
  enableParticles: boolean;
  fps: number;
  frameDuration: number; // in milliseconds
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AppConfig {
  generationProviders: GenerationProviders;
  gemini: GeminiConfig;
  comfy: ComfyConfig;
  openAICompatible: OpenAICompatibleConfig;
  chatterbox: ChatterboxConfig;
  kokoro: KokoroConfig;
  audioGen: AudioGenConfig;
  imageGen: ImageGenConfig;
  video: VideoGenConfig;
  youtube: YouTubeConfig;
}
