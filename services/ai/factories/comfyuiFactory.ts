import { CallWrapper, ComfyApi, PromptBuilder } from '@saintno/comfyui-sdk';
import { AppConfig, Story } from '../../../types';
import { constructImagePrompt } from '../prompts';
import { uploadToSupabase } from '../storage';
import { AIGenerationFactory, GeneratedAudio, GeneratedStoryText } from '../types';
import comfySD35Workflow from './comfy-image-sd35.json';
import comfyMusicWorkflow from './comfy-music.json';

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

function toComfyHost(endpoint: string): string {
  try {
    const parsed = new URL(endpoint);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    throw new Error('ComfyUI endpoint must be a valid URL.');
  }
}

function buildAbsoluteUrl(baseHost: string, maybeRelative: string): string {
  if (maybeRelative.startsWith('http://') || maybeRelative.startsWith('https://')) {
    return maybeRelative;
  }

  return new URL(maybeRelative, baseHost).toString();
}

async function uploadImageFromComfy(storyId: string, imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch generated image (${response.status}).`);
  }

  const blob = await response.blob();
  const contentType = blob.type || 'image/png';
  const extension = contentType.includes('webp') ? 'webp' : contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
  return await uploadToSupabase('thumbnails', `${storyId}.${extension}`, blob, contentType);
}

async function uploadMusicFromComfy(storyId: string, audioUrl: string): Promise<string> {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch generated music (${response.status}).`);
  }

  const blob = await response.blob();
  const contentType = blob.type || 'audio/mpeg';
  const extension = contentType.includes('wav') ? 'wav' : 'mp3';
  return await uploadToSupabase('music', `${storyId}.${extension}`, blob, contentType);
}

function createImageWorkflow(story: Story, config: AppConfig) {
  const prompt = constructImagePrompt(story);
  const width = config.imageGen.width || 512;
  const height = config.imageGen.height || 512;

  return new PromptBuilder(
    JSON.parse(JSON.stringify(comfySD35Workflow)),
    ['positive', 'seed', 'width', 'height'],
    ['images'],
  )
    .setInputNode('seed', '3.inputs.seed')
    .setInputNode('positive', '6.inputs.text')
    .setInputNode('width', '5.inputs.width')
    .setInputNode('height', '5.inputs.height')
    .input('seed', randomSeed())
    .input('width', width)
    .input('height', height)
    .input('positive', prompt)
    ;
}

function createMusicWorkflow(story: Story) {
  const musicPrompt = story.music?.trim() || `Cinematic ambient score inspired by: ${story.title}. ${story.summary}`;
  const seconds = story.duration || 60;

  return new PromptBuilder(
    JSON.parse(JSON.stringify(comfyMusicWorkflow)),
    ['tags', 'seconds'],
    ['audio'],
  )
    .setInputNode('tags', '94.inputs.tags')
    .setInputNode('seconds', '98.inputs.seconds')
    .setOutputNode('audio', '107')
    .input('tags', musicPrompt)
    .input('seconds', seconds);
}

async function createComfyApi(config: AppConfig): Promise<ComfyApi> {
  const host = toComfyHost(config.comfy.endpoint || '');
  const api = new ComfyApi(host, undefined, config.comfy.apiKey ? {
    credentials: {
      type: 'bearer_token',
      token: config.comfy.apiKey,
    },
  } : undefined).init();

  await api.waitForReady();
  return api;
}

async function executeWorkflowByCallbacks<TOutput extends Record<string, any>>(
  api: ComfyApi,
  workflow: PromptBuilder<any, any, any>,
  workflowName: string,
): Promise<TOutput> {
  return await new Promise<TOutput>((resolve, reject) => {
    const wrapper = new CallWrapper(api, workflow)
      .onFinished((data) => {
        resolve(data as TOutput);
      })
      .onFailed((error) => {
        console.error(`ComfyUI ${workflowName} workflow failed:`, error);
        api.destroy();
        reject(error);
      });

    wrapper.run();
  });
}

async function runImageWorkflow(api: ComfyApi, workflow: ReturnType<typeof createImageWorkflow>): Promise<string | null> {
  const result = await executeWorkflowByCallbacks<Record<'images' | '_raw', any>>(api, workflow, 'image');

  if (!result) {
    return null;
  }

  const primaryImage = result.images?.images?.[0];
  if (primaryImage) {
    return api.getPathImage(primaryImage);
  }

  const rawOutputs = result._raw || {};
  for (const nodeOutput of Object.values(rawOutputs as Record<string, any>)) {
    const image = nodeOutput?.images?.[0];
    if (image) {
      return api.getPathImage(image);
    }
  }

  return null;
}

async function runMusicWorkflow(api: ComfyApi, workflow: ReturnType<typeof createMusicWorkflow>): Promise<string | null> {
  const result = await executeWorkflowByCallbacks<Record<'audio' | '_raw', any>>(api, workflow, 'music');

  if (!result) {
    return null;
  }

  const audioOutput = result.audio;
  const directAudio = asNonEmptyString(audioOutput?.audioUI);
  if (directAudio) {
    return buildAbsoluteUrl(api.apiHost, directAudio);
  }

  const primaryAudio = audioOutput?.audio?.[0];
  if (primaryAudio) {
    return buildAbsoluteUrl(api.apiHost, api.getPathImage(primaryAudio));
  }

  const rawOutputs = result._raw || {};
  for (const nodeOutput of Object.values(rawOutputs as Record<string, any>)) {
    const audioUI = asNonEmptyString(nodeOutput?.audioUI);
    if (audioUI) {
      return buildAbsoluteUrl(api.apiHost, audioUI);
    }

    const audio = nodeOutput?.audio?.[0];
    if (audio) {
      return buildAbsoluteUrl(api.apiHost, api.getPathImage(audio));
    }
  }

  return null;
}

export class ComfyUIAIGenerationFactory implements AIGenerationFactory {
  async generateText(_config: AppConfig, _storyDetails: Story): Promise<GeneratedStoryText> {
    throw new Error('ComfyUI provider does not support text generation. Use Gemini provider for text.');
  }

  async generateProjectIdeas(_config: AppConfig, _theme: string): Promise<string[]> {
    throw new Error('ComfyUI provider does not support text generation. Use Gemini provider for text.');
  }

  async generateImage(config: AppConfig, story: Story): Promise<string> {
    if (!config.comfy.endpoint?.trim()) {
      throw new Error('ComfyUI endpoint is required for image generation.');
    }

    const api = await createComfyApi(config);

    try {
      const workflow = createImageWorkflow(story, config);
      const imageUrl = await runImageWorkflow(api, workflow);
      if (!imageUrl) {
        throw new Error('ComfyUI response did not include generated image output.');
      }

      return await uploadImageFromComfy(story.id, imageUrl);
    } catch (error: any) {
      console.error('ComfyUI image generation error details:', error);
      throw new Error(error.message || 'ComfyUI image generation failed.');
    } finally {
      api.destroy();
    }
  }

  async generateAudio(_config: AppConfig, _story: Story): Promise<GeneratedAudio> {
    throw new Error('ComfyUI provider does not support audio generation. Use Gemini provider for audio.');
  }

  async generateMusic(config: AppConfig, story: Story): Promise<string> {
    if (!config.comfy.endpoint?.trim()) {
      throw new Error('ComfyUI endpoint is required for music generation.');
    }

    const api = await createComfyApi(config);

    try {
      const workflow = createMusicWorkflow(story);
      const musicUrl = await runMusicWorkflow(api, workflow);
      if (!musicUrl) {
        throw new Error('ComfyUI response did not include generated music output.');
      }

      return await uploadMusicFromComfy(story.id, musicUrl);
    } catch (error: any) {
      console.error('ComfyUI music generation error details:', error);
      throw new Error(error.message || 'ComfyUI music generation failed.');
    } finally {
      api.destroy();
    }
  }
}