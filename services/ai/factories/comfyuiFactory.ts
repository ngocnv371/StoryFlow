import { AppConfig, Story } from '../../../types';
import { constructImagePrompt } from '../prompts';
import { uploadBase64ToSupabase } from '../storage';
import { AIGenerationFactory, GeneratedStoryText } from '../types';

export class ComfyUIAIGenerationFactory implements AIGenerationFactory {
  async generateText(_config: AppConfig, _storyDetails: Story): Promise<GeneratedStoryText> {
    throw new Error('ComfyUI provider does not support text generation. Use Gemini provider for text.');
  }

  async generateImage(config: AppConfig, story: Story): Promise<string> {
    if (!config.comfy.endpoint) {
      throw new Error('ComfyUI endpoint is required for image generation.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.comfy.apiKey) {
      headers.Authorization = `Bearer ${config.comfy.apiKey}`;
    }

    try {
      const response = await fetch(config.comfy.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: constructImagePrompt(story),
          storyId: story.id,
          aspectRatio: config.imageGen.width && config.imageGen.height ? `${config.imageGen.width}:${config.imageGen.height}` : '16:9',
          width: config.imageGen.width,
          height: config.imageGen.height,
          cfg: config.imageGen.cfg,
          model: config.comfy.model,
        }),
      });

      if (!response.ok) {
        throw new Error(`ComfyUI request failed (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      const directUrl = data?.imageUrl || data?.url || data?.images?.[0]?.url;
      if (typeof directUrl === 'string' && directUrl.length > 0) {
        return directUrl;
      }

      const base64 = data?.base64 || data?.imageBase64 || data?.images?.[0]?.base64;
      if (typeof base64 === 'string' && base64.length > 0) {
        return await uploadBase64ToSupabase('thumbnails', `${story.id}.png`, base64, 'image/png');
      }

      throw new Error('ComfyUI response did not include imageUrl or base64 image data.');
    } catch (error: any) {
      console.error('ComfyUI image generation error details:', error);
      throw new Error(error.message || 'ComfyUI image generation failed.');
    }
  }

  async generateAudio(_config: AppConfig, _story: Story): Promise<string> {
    throw new Error('ComfyUI provider does not support audio generation. Use Gemini provider for audio.');
  }
}
