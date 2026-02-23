import { AppConfig, Story } from '../../types';

export type AIProviderFactoryType = 'gemini' | 'comfyui';

export type GeneratedStoryText = Pick<Story, 'title' | 'transcript' | 'narrator' | 'music' | 'tags'>;

export interface AIGenerationFactory {
  generateText(config: AppConfig, storyDetails: Story): Promise<GeneratedStoryText>;
  generateImage(config: AppConfig, story: Story): Promise<string>;
  generateAudio(config: AppConfig, story: Story): Promise<string>;
}
