import { AppConfig, Story } from '../../../types';
import { constructImagePrompt } from '../prompts';
import { uploadBase64ToSupabase, uploadToSupabase } from '../storage';
import { AIGenerationFactory, GeneratedAudio, GeneratedStoryText } from '../types';
import comfyZImageWorkflow from './comfy-zimage.json';
import comfySD35Workflow from './comfy-image-sd35.json';
import comfyMusicWorkflow from './comfy-music.json';

const COMFY_POLL_INTERVAL_MS = 1500;
const COMFY_MAX_POLL_ATTEMPTS = 80;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function buildSiblingPathUrl(endpoint: string, ...segmentsToAppend: string[]): string {
  const url = new URL(endpoint);
  const segments = url.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    segments.push(...segmentsToAppend);
  } else {
    segments[segments.length - 1] = segmentsToAppend[0];
    segments.push(...segmentsToAppend.slice(1));
  }

  url.pathname = `/${segments.join('/')}`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function extractImageUrlFromComfyOutputs(outputs: unknown, endpoint: string): string | null {
  if (!outputs || typeof outputs !== 'object') {
    return null;
  }

  for (const nodeOutput of Object.values(outputs as Record<string, any>)) {
    const images = Array.isArray(nodeOutput?.images) ? nodeOutput.images : [];
    for (const image of images) {
      const directUrl = asNonEmptyString(image?.url);
      if (directUrl) {
        return directUrl;
      }

      const filename = asNonEmptyString(image?.filename);
      if (filename) {
        const viewUrl = new URL(buildSiblingPathUrl(endpoint, 'view'));
        viewUrl.searchParams.set('filename', filename);
        viewUrl.searchParams.set('subfolder', asNonEmptyString(image?.subfolder) ?? '');
        viewUrl.searchParams.set('type', asNonEmptyString(image?.type) ?? 'output');
        return viewUrl.toString();
      }
    }
  }

  return null;
}

function extractAudioUrlFromComfyOutputs(outputs: unknown, endpoint: string): string | null {
  if (!outputs || typeof outputs !== 'object') {
    return null;
  }

  for (const nodeOutput of Object.values(outputs as Record<string, any>)) {
    const audioArray = Array.isArray(nodeOutput?.audio) ? nodeOutput.audio : [];
    for (const audio of audioArray) {
      const directUrl = asNonEmptyString(audio?.url);
      if (directUrl) {
        return directUrl;
      }

      const filename = asNonEmptyString(audio?.filename);
      if (filename) {
        const viewUrl = new URL(buildSiblingPathUrl(endpoint, 'view'));
        viewUrl.searchParams.set('filename', filename);
        viewUrl.searchParams.set('subfolder', asNonEmptyString(audio?.subfolder) ?? 'audio');
        viewUrl.searchParams.set('type', asNonEmptyString(audio?.type) ?? 'output');
        return viewUrl.toString();
      }
    }

    const audioUi = asNonEmptyString(nodeOutput?.audioUI);
    if (audioUi) {
      if (audioUi.startsWith('http://') || audioUi.startsWith('https://')) {
        return audioUi;
      }
      return new URL(audioUi, endpoint).toString();
    }
  }

  return null;
}

async function extractImageResult(
  data: any,
  endpoint: string,
  storyId: string,
  promptId?: string,
): Promise<string | null> {
  const uploadImageFromUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch generated image (${response.status}).`);
      }

      const blob = await response.blob();
      const contentType = blob.type || 'image/png';
      const extension = contentType.includes('webp') ? 'webp' : contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
      return await uploadToSupabase('thumbnails', `${storyId}.${extension}`, blob, contentType);
    } catch {
      return url;
    }
  };

  const directUrl =
    asNonEmptyString(data?.imageUrl) ||
    asNonEmptyString(data?.url) ||
    asNonEmptyString(data?.images?.[0]?.url);
  if (directUrl) {
    return await uploadImageFromUrl(directUrl);
  }

  const base64 =
    asNonEmptyString(data?.base64) ||
    asNonEmptyString(data?.imageBase64) ||
    asNonEmptyString(data?.images?.[0]?.base64);
  if (base64) {
    return await uploadBase64ToSupabase('thumbnails', `${storyId}.png`, base64, 'image/png');
  }

  const historyEntry = promptId ? data?.[promptId] : null;
  const outputUrl =
    extractImageUrlFromComfyOutputs(data?.outputs, endpoint) ||
    extractImageUrlFromComfyOutputs(historyEntry?.outputs, endpoint);
  if (outputUrl) {
    return await uploadImageFromUrl(outputUrl);
  }

  return null;
}

async function extractMusicResult(
  data: any,
  endpoint: string,
  storyId: string,
  promptId?: string,
): Promise<string | null> {
  const directUrl =
    asNonEmptyString(data?.audioUrl) ||
    asNonEmptyString(data?.url) ||
    asNonEmptyString(data?.audios?.[0]?.url);
  if (directUrl) {
    return directUrl;
  }

  const historyEntry = promptId ? data?.[promptId] : null;
  const outputUrl =
    extractAudioUrlFromComfyOutputs(data?.outputs, endpoint) ||
    extractAudioUrlFromComfyOutputs(historyEntry?.outputs, endpoint);
  if (outputUrl) {
    try {
      const response = await fetch(outputUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch generated music (${response.status}).`);
      }

      const blob = await response.blob();
      const contentType = blob.type || 'audio/mpeg';
      const extension = contentType.includes('wav') ? 'wav' : 'mp3';
      return await uploadToSupabase('music', `${storyId}.${extension}`, blob, contentType);
    } catch {
      return outputUrl;
    }
  }

  return null;
}

function getPromptId(data: any): string | null {
  return asNonEmptyString(data?.prompt_id) || asNonEmptyString(data?.promptId) || asNonEmptyString(data?.id);
}

function hasFailedStatus(data: any, promptId: string): boolean {
  const candidateStatuses = [
    data?.status,
    data?.status_str,
    data?.state,
    data?.[promptId]?.status?.status_str,
    data?.[promptId]?.status,
    data?.[promptId]?.state,
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase());

  return candidateStatuses.some((value) => value.includes('error') || value.includes('fail'));
}

async function pollForComfyImage(
  endpoint: string,
  headers: Record<string, string>,
  promptId: string,
  storyId: string,
): Promise<string> {
  const authHeaders: Record<string, string> = {};
  if (headers.Authorization) {
    authHeaders.Authorization = headers.Authorization;
  }

  const historyByIdUrl = buildSiblingPathUrl(endpoint, 'history', encodeURIComponent(promptId));
  const historyQueryUrl = new URL(buildSiblingPathUrl(endpoint, 'history'));
  historyQueryUrl.searchParams.set('prompt_id', promptId);

  const endpointQueryUrl = new URL(endpoint);
  endpointQueryUrl.searchParams.set('prompt_id', promptId);
  const pollUrls = [historyByIdUrl, historyQueryUrl.toString(), endpointQueryUrl.toString()];

  for (let attempt = 0; attempt < COMFY_MAX_POLL_ATTEMPTS; attempt += 1) {
    let lastPingError: string | null = null;

    for (const pollUrl of pollUrls) {
      try {
        const response = await fetch(pollUrl, {
          method: 'GET',
          headers: authHeaders,
        });

        if (!response.ok) {
          let details = '';
          try {
            const body = await response.text();
            details = body ? ` - ${body}` : '';
          } catch {
            // ignore response-body parsing errors for ping failure details
          }
          lastPingError = `Ping request failed (${response.status}) at ${pollUrl}${details}`;
          continue;
        }

        const data = await response.json();
        const image = await extractImageResult(data, endpoint, storyId, promptId);
        if (image) {
          return image;
        }

        if (hasFailedStatus(data, promptId)) {
          throw new Error(`ComfyUI generation failed for prompt_id ${promptId}.`);
        }

        lastPingError = null;
        break;
      } catch (error) {
        if (error instanceof Error && error.message.includes('generation failed')) {
          throw error;
        }

        lastPingError = error instanceof Error ? `Ping request failed at ${pollUrl}: ${error.message}` : `Ping request failed at ${pollUrl}.`;
      }
    }

    if (lastPingError) {
      throw new Error(`ComfyUI ping failed for prompt_id ${promptId}. ${lastPingError}`);
    }

    await sleep(COMFY_POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for ComfyUI image result for prompt_id ${promptId}.`);
}

async function pollForComfyMusic(
  endpoint: string,
  headers: Record<string, string>,
  promptId: string,
  storyId: string,
): Promise<string> {
  const authHeaders: Record<string, string> = {};
  if (headers.Authorization) {
    authHeaders.Authorization = headers.Authorization;
  }

  const historyByIdUrl = buildSiblingPathUrl(endpoint, 'history', encodeURIComponent(promptId));
  const historyQueryUrl = new URL(buildSiblingPathUrl(endpoint, 'history'));
  historyQueryUrl.searchParams.set('prompt_id', promptId);

  const endpointQueryUrl = new URL(endpoint);
  endpointQueryUrl.searchParams.set('prompt_id', promptId);
  const pollUrls = [historyByIdUrl, historyQueryUrl.toString(), endpointQueryUrl.toString()];

  for (let attempt = 0; attempt < COMFY_MAX_POLL_ATTEMPTS; attempt += 1) {
    let lastPingError: string | null = null;

    for (const pollUrl of pollUrls) {
      try {
        const response = await fetch(pollUrl, {
          method: 'GET',
          headers: authHeaders,
        });

        if (!response.ok) {
          let details = '';
          try {
            const body = await response.text();
            details = body ? ` - ${body}` : '';
          } catch {
          }
          lastPingError = `Ping request failed (${response.status}) at ${pollUrl}${details}`;
          continue;
        }

        const data = await response.json();
        const music = await extractMusicResult(data, endpoint, storyId, promptId);
        if (music) {
          return music;
        }

        if (hasFailedStatus(data, promptId)) {
          throw new Error(`ComfyUI music generation failed for prompt_id ${promptId}.`);
        }

        lastPingError = null;
        break;
      } catch (error) {
        if (error instanceof Error && error.message.includes('generation failed')) {
          throw error;
        }

        lastPingError = error instanceof Error ? `Ping request failed at ${pollUrl}: ${error.message}` : `Ping request failed at ${pollUrl}.`;
      }
    }

    if (lastPingError) {
      throw new Error(`ComfyUI ping failed for prompt_id ${promptId}. ${lastPingError}`);
    }

    await sleep(COMFY_POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for ComfyUI music result for prompt_id ${promptId}.`);
}

function createZImageWorkflow(story: Story, config: AppConfig) {
  const prompt = constructImagePrompt(story);

  const workflow = JSON.parse(JSON.stringify(comfyZImageWorkflow));
  // the indexes "6" and "13" are based on the structure of comfy-zimage.json and may need to be updated if the workflow changes
  workflow["6"].inputs.text = prompt;
  workflow["13"].inputs.width = config.imageGen.width || 512;
  workflow["13"].inputs.height = config.imageGen.height || 512;
  return workflow;
}

function createSD35ImageWorkflow(story: Story, config: AppConfig) {
  const prompt = constructImagePrompt(story);

  const workflow = JSON.parse(JSON.stringify(comfySD35Workflow));
  // the indexes "6" and "5" are based on the structure of comfy-sample-flow.json and may need to be updated if the workflow changes
  workflow["6"].inputs.text = prompt;
  workflow["5"].inputs.width = config.imageGen.width || 512;
  workflow["5"].inputs.height = config.imageGen.height || 512;
  return workflow;
}

function createMusicWorkflow(story: Story): Record<string, any> {
  const workflow = JSON.parse(JSON.stringify(comfyMusicWorkflow));
  const musicPrompt = story.music?.trim() || `Cinematic ambient score inspired by: ${story.title}. ${story.summary}`;
  workflow['94'].inputs.tags = musicPrompt;
  workflow['98'].inputs.seconds = story.duration;
  return workflow;
}

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
          prompt: createSD35ImageWorkflow(story, config),
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
      const immediateResult = await extractImageResult(data, config.comfy.endpoint, story.id);
      if (immediateResult) {
        return immediateResult;
      }

      const promptId = getPromptId(data);
      if (promptId) {
        return await pollForComfyImage(config.comfy.endpoint, headers, promptId, story.id);
      }

      throw new Error('ComfyUI response did not include image data or prompt_id for polling.');
    } catch (error: any) {
      console.error('ComfyUI image generation error details:', error);
      throw new Error(error.message || 'ComfyUI image generation failed.');
    }
  }

  async generateAudio(_config: AppConfig, _story: Story): Promise<GeneratedAudio> {
    throw new Error('ComfyUI provider does not support audio generation. Use Gemini provider for audio.');
  }

  async generateMusic(config: AppConfig, story: Story): Promise<string> {
    if (!config.comfy.endpoint) {
      throw new Error('ComfyUI endpoint is required for music generation.');
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
          prompt: createMusicWorkflow(story),
          storyId: story.id,
          model: config.comfy.model,
        }),
      });

      if (!response.ok) {
        throw new Error(`ComfyUI request failed (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      const immediateResult = await extractMusicResult(data, config.comfy.endpoint, story.id);
      if (immediateResult) {
        return immediateResult;
      }

      const promptId = getPromptId(data);
      if (promptId) {
        return await pollForComfyMusic(config.comfy.endpoint, headers, promptId, story.id);
      }

      throw new Error('ComfyUI response did not include music data or prompt_id for polling.');
    } catch (error: any) {
      console.error('ComfyUI music generation error details:', error);
      throw new Error(error.message || 'ComfyUI music generation failed.');
    }
  }
}
