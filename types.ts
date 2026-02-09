
export interface Story {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  tags: string[];
  transcript: string;
  narrator?: string;
  music?: string;
  status: 'Draft' | 'Pending' | 'Completed';
  created_at: string;
  thumbnail_url: string;
  audio_url?: string;
}

export type TextGenProvider = 'gemini' | 'openai';
export type AudioGenProvider = 'gemini' | 'elevenlabs' | 'whisper';

export interface TextGenConfig {
  provider: TextGenProvider;
  apiKey: string;
  model: string;
  endpoint?: string;
}

export interface AudioGenConfig {
  provider: AudioGenProvider;
  apiKey: string;
  model?: string;
  endpoint?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AppConfig {
  textGen: TextGenConfig;
  audioGen: AudioGenConfig;
}
