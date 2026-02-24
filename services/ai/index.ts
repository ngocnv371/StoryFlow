import { AppConfig, Story } from '../../types';
import { ComfyUIAIGenerationFactory } from './factories/comfyuiFactory';
import { GeminiAIGenerationFactory } from './factories/geminiFactory';
import { constructImagePrompt } from './prompts';
import { uploadVideoToSupabase } from './storage';
import { AIGenerationFactory, AIProviderFactoryType, GeneratedStoryText } from './types';

export type { AIGenerationFactory, AIProviderFactoryType, GeneratedStoryText } from './types';
export { constructImagePrompt, uploadVideoToSupabase };

export const createAIGenerationFactory = (provider: AIProviderFactoryType = 'gemini'): AIGenerationFactory => {
  if (provider === 'comfyui') {
    return new ComfyUIAIGenerationFactory();
  }

  return new GeminiAIGenerationFactory();
};

export const generateCoverImage = async (config: AppConfig, story: Story): Promise<string> => {
  const provider: AIProviderFactoryType = config.provider === 'comfyui' ? 'comfyui' : 'gemini';
  const factory = createAIGenerationFactory(provider);
  return await factory.generateImage(config, story);
};

export const generateAudioSpeech = async (config: AppConfig, story: Story): Promise<string> => {
  const factory = createAIGenerationFactory('gemini');
  return await factory.generateAudio(config, story);
};

export const generateBackgroundMusic = async (config: AppConfig, story: Story): Promise<string> => {
  const factory = createAIGenerationFactory('comfyui');
  return await factory.generateMusic(config, story);
};

export const generateStoryTranscript = async (
  config: AppConfig,
  storyDetails: Story
): Promise<GeneratedStoryText> => {
  const factory = createAIGenerationFactory('gemini');
  return await factory.generateText(config, storyDetails);
};
