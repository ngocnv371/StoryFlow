
export interface Story {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  transcript: string;
  status: 'Draft' | 'Pending' | 'Completed';
  createdAt: string;
  thumbnail: string;
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
  username: string;
  role: string;
}

export interface AppConfig {
  textGen: TextGenConfig;
  audioGen: AudioGenConfig;
}
