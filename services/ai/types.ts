import { AudioGenConfig, ImageGenConfig, TextGenConfig, Story } from '../../types';

export type AIProviderFactoryType = 'gemini' | 'comfyui';

export type GeneratedStoryText = Pick<Story, 'title' | 'transcript' | 'narrator' | 'music' | 'tags'>;

export interface AIGenerationFactory {
  generateText(config: TextGenConfig, storyDetails: Story): Promise<GeneratedStoryText>;
  generateImage(config: ImageGenConfig, story: Story): Promise<string>;
  generateAudio(config: AudioGenConfig, story: Story): Promise<string>;
}
