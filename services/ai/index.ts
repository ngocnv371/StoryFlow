import { AppConfig, ImagePromptSection, Story } from '../../types';
import { ChatterboxAIGenerationFactory } from './factories/chatterboxFactory';
import { ComfyUIAIGenerationFactory } from './factories/comfyuiFactory';
import { GeminiAIGenerationFactory } from './factories/geminiFactory';
import { KokoroAIGenerationFactory } from './factories/kokoroFactory';
import { OpenAICompatibleAIGenerationFactory } from './factories/openAICompatibleFactory';
import { constructImagePrompt } from './prompts';
import { uploadVideoToSupabase } from './storage';
import { AIGenerationFactory, AIProviderFactoryType, GeneratedAudio, GeneratedStoryText } from './types';

export type { AIGenerationFactory, AIProviderFactoryType, GeneratedAudio, GeneratedStoryText } from './types';
export { constructImagePrompt, uploadVideoToSupabase };

export const createAIGenerationFactory = (provider: AIProviderFactoryType = 'gemini'): AIGenerationFactory => {
  if (provider === 'comfyui') {
    return new ComfyUIAIGenerationFactory();
  }

  if (provider === 'openai-compatible') {
    return new OpenAICompatibleAIGenerationFactory();
  }

  if (provider === 'chatterbox') {
    return new ChatterboxAIGenerationFactory();
  }

  if (provider === 'kokoro') {
    return new KokoroAIGenerationFactory();
  }

  return new GeminiAIGenerationFactory();
};

export const generateCoverImage = async (config: AppConfig, story: Story): Promise<string> => {
  const provider: AIProviderFactoryType = config.generationProviders.image === 'comfyui' ? 'comfyui' : 'gemini';
  const factory = createAIGenerationFactory(provider);
  return await factory.generateImage(config, story);
};

export const generateAudioSpeech = async (config: AppConfig, story: Story): Promise<GeneratedAudio> => {
  const provider: AIProviderFactoryType =
    config.generationProviders.narration === 'chatterbox'
      ? 'chatterbox'
      : config.generationProviders.narration === 'kokoro'
        ? 'kokoro'
      : config.generationProviders.narration === 'comfyui'
        ? 'comfyui'
        : 'gemini';
  const factory = createAIGenerationFactory(provider);
  return await factory.generateAudio(config, story);
};

export const generateBackgroundMusic = async (config: AppConfig, story: Story): Promise<string> => {
  const provider: AIProviderFactoryType = config.generationProviders.music === 'comfyui' ? 'comfyui' : 'gemini';
  const factory = createAIGenerationFactory(provider);
  return await factory.generateMusic(config, story);
};

export const generateStoryTranscript = async (
  config: AppConfig,
  storyDetails: Story
): Promise<GeneratedStoryText> => {
  const provider: AIProviderFactoryType =
    config.generationProviders.text === 'openai-compatible'
      ? 'openai-compatible'
      : config.generationProviders.text === 'comfyui'
        ? 'comfyui'
        : 'gemini';
  const factory = createAIGenerationFactory(provider);
  return await factory.generateText(config, storyDetails);
};

export const extendStoryTranscript = async (
  config: AppConfig,
  tags: string[],
  transcript: string
): Promise<string> => {
  const provider: AIProviderFactoryType =
    config.generationProviders.text === 'openai-compatible'
      ? 'openai-compatible'
      : config.generationProviders.text === 'comfyui'
        ? 'comfyui'
        : 'gemini';
  const factory = createAIGenerationFactory(provider);
  return await factory.extendTranscript(config, tags, transcript);
};

export const generateProjectIdeas = async (
  config: AppConfig,
  theme: string
): Promise<string[]> => {
  const provider: AIProviderFactoryType =
    config.generationProviders.text === 'openai-compatible'
      ? 'openai-compatible'
      : config.generationProviders.text === 'comfyui'
        ? 'comfyui'
        : 'gemini';
  const factory = createAIGenerationFactory(provider);
  return await factory.generateProjectIdeas(config, theme);
};

export const generateImagePrompts = async (
  config: AppConfig,
  story: Story
): Promise<ImagePromptSection[]> => {
  const provider: AIProviderFactoryType =
    config.generationProviders.text === 'openai-compatible'
      ? 'openai-compatible'
      : config.generationProviders.text === 'comfyui'
        ? 'comfyui'
        : 'gemini';
  const factory = createAIGenerationFactory(provider);
  return await factory.generateImagePrompts(config, story);
};

export const generateMultipleImages = async (
  config: AppConfig,
  story: Story,
  imagePrompts: string[]
): Promise<string[]> => {
  const imageProvider: AIProviderFactoryType = config.generationProviders.image === 'comfyui' ? 'comfyui' : 'gemini';
  const factory = createAIGenerationFactory(imageProvider);
  
  const imageUrls: string[] = [];
  for (let i = 0; i < imagePrompts.length; i++) {
    try {
      // Create a temporary story object with the current prompt
      const tempStory = {
        ...story,
        cover_prompt: imagePrompts[i]
      };
      const imageUrl = await factory.generateImage(config, tempStory);
      imageUrls.push(imageUrl);
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}/${imagePrompts.length}:`, error);
      // Continue with next image instead of failing completely
    }
  }
  
  return imageUrls;
};
