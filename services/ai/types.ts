import { AppConfig, Story } from '../../types';

export type AIProviderFactoryType = 'gemini' | 'comfyui';

export type GeneratedStoryText = Pick<Story, 'title' | 'transcript' | 'narrator' | 'music' | 'cover_prompt' | 'tags'>;
export type GeneratedAudio = {
  url: string;
  duration: number;
};

export interface AIGenerationFactory {
  generateText(config: AppConfig, storyDetails: Story): Promise<GeneratedStoryText>;
  generateProjectIdeas(config: AppConfig, theme: string): Promise<string[]>;
  generateImage(config: AppConfig, story: Story): Promise<string>;
  generateAudio(config: AppConfig, story: Story): Promise<GeneratedAudio>;
  generateMusic(config: AppConfig, story: Story): Promise<string>;
}
