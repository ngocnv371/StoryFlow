import { AppConfig, ImagePromptSection, Story } from '../../types';

export type AIProviderFactoryType = 'gemini' | 'comfyui' | 'openai-compatible' | 'chatterbox' | 'kokoro';

export type GeneratedStoryText = Pick<Story, 'title' | 'transcript' | 'narrator' | 'music' | 'cover_prompt' | 'tags'>;
export type GeneratedAudio = {
  url: string;
  duration: number;
};

export interface AIGenerationFactory {
  generateText(config: AppConfig, storyDetails: Story): Promise<GeneratedStoryText>;
  extendTranscript(config: AppConfig, tags: string[], transcript: string): Promise<string>;
  generateProjectIdeas(config: AppConfig, theme: string): Promise<string[]>;
  generateImage(config: AppConfig, story: Story): Promise<string>;
  generateImagePrompts(config: AppConfig, story: Story): Promise<ImagePromptSection[]>;
  generateAudio(config: AppConfig, story: Story): Promise<GeneratedAudio>;
  generateMusic(config: AppConfig, story: Story): Promise<string>;
}
