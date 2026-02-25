
export interface Story {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  metadata?: Record<string, unknown>;
  tags: string[];
  transcript: string;
  cover_prompt?: string;
  narrator?: string;
  music?: string;
  status: 'Draft' | 'Pending' | 'Completed';
  created_at: string;
  thumbnail_url: string;
  audio_url?: string;
  duration?: number;
  music_url?: string;
  video_url?: string;
}

export type AIProvider = 'gemini' | 'comfyui';
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

export interface AudioGenConfig {
  voice?: string;
  speed?: number;
}

export interface ImageGenConfig {
  width?: number;
  height?: number;
  cfg?: number;
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
  audioGen: AudioGenConfig;
  imageGen: ImageGenConfig;
}
