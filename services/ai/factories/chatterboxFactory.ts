import { AppConfig, Story } from '../../../types';
import { uploadBase64ToSupabase, uploadToSupabase } from '../storage';
import { AIGenerationFactory, GeneratedAudio, GeneratedStoryText } from '../types';
import { TRANSCRIPT_SOFT_LIMIT } from '@/constants';

type ChatterboxJsonResponse = {
  url?: string;
  audioUrl?: string;
  base64?: string;
  audioBase64?: string;
  mimeType?: string;
  contentType?: string;
  duration?: number;
  durationSeconds?: number;
};

const DEFAULT_MODEL = 'chatterbox';

const asNonEmptyString = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

const asPositiveNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
};

const estimateDurationFromBlob = async (blob: Blob): Promise<number | null> => {
  try {
    const audioContext = new AudioContext();
    const buffer = await blob.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(buffer.slice(0));
    await audioContext.close();
    return Math.max(1, Math.round(decoded.duration));
  } catch {
    return null;
  }
};

export class ChatterboxAIGenerationFactory implements AIGenerationFactory {
  async generateText(_config: AppConfig, _storyDetails: Story): Promise<GeneratedStoryText> {
    throw new Error('Chatterbox provider supports narration only. Use Gemini or OpenAI compatible for text.');
  }

  async extendTranscript(_config: AppConfig, _tags: string[], _transcript: string): Promise<string> {
    throw new Error('Chatterbox provider supports narration only. Use Gemini or OpenAI compatible for text.');
  }

  async generateProjectIdeas(_config: AppConfig, _theme: string): Promise<string[]> {
    throw new Error('Chatterbox provider supports narration only. Use Gemini or OpenAI compatible for text.');
  }

  async generateImage(_config: AppConfig, _story: Story): Promise<string> {
    throw new Error('Chatterbox provider supports narration only. Use Gemini or ComfyUI for images.');
  }

  async generateAudio(config: AppConfig, story: Story): Promise<GeneratedAudio> {
    const endpoint = config.chatterbox.endpoint.trim();
    if (!endpoint) {
      throw new Error('Chatterbox endpoint is required for narration generation.');
    }

    const transcript = story.transcript.substring(0, TRANSCRIPT_SOFT_LIMIT).trim();
    if (!transcript) {
      throw new Error('Transcript is required before generating narration.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = config.chatterbox.token.trim();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const voice = config.audioGen.voice || (story.metadata?.voice as string) || 'default';
    const speed = config.audioGen.speed ?? 1;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        input: transcript,
        voice,
        speed,
      }),
    });

    if (!response.ok) {
      let details = '';
      try {
        const body = await response.text();
        details = body ? ` - ${body}` : '';
      } catch {
      }
      throw new Error(`Chatterbox request failed (${response.status})${details}`);
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    if (contentType.startsWith('audio/')) {
      const audioBlob = await response.blob();
      const extension = contentType.includes('wav') ? 'wav' : contentType.includes('ogg') ? 'ogg' : 'mp3';
      const audioUrl = await uploadToSupabase('audio', `${story.id}.${extension}`, audioBlob, contentType);
      const duration = (await estimateDurationFromBlob(audioBlob)) ?? 0;
      return { url: audioUrl, duration };
    }

    const data = (await response.json()) as ChatterboxJsonResponse;
    const responseDuration = asPositiveNumber(data.duration) ?? asPositiveNumber(data.durationSeconds);

    const directUrl = asNonEmptyString(data.audioUrl) || asNonEmptyString(data.url);
    if (directUrl) {
      try {
        const audioResponse = await fetch(directUrl);
        if (!audioResponse.ok) {
          throw new Error();
        }

        const audioBlob = await audioResponse.blob();
        const audioMime = audioBlob.type || 'audio/mpeg';
        const extension = audioMime.includes('wav') ? 'wav' : audioMime.includes('ogg') ? 'ogg' : 'mp3';
        const uploadedUrl = await uploadToSupabase('audio', `${story.id}.${extension}`, audioBlob, audioMime);
        const estimatedDuration = (await estimateDurationFromBlob(audioBlob)) ?? 0;
        return { url: uploadedUrl, duration: responseDuration ?? estimatedDuration };
      } catch {
        return { url: directUrl, duration: responseDuration ?? 0 };
      }
    }

    const base64Audio = asNonEmptyString(data.audioBase64) || asNonEmptyString(data.base64);
    if (base64Audio) {
      const audioMime = asNonEmptyString(data.mimeType) || asNonEmptyString(data.contentType) || 'audio/wav';
      const extension = audioMime.includes('wav') ? 'wav' : audioMime.includes('ogg') ? 'ogg' : 'mp3';
      const uploadedUrl = await uploadBase64ToSupabase('audio', `${story.id}.${extension}`, base64Audio, audioMime);
      return { url: uploadedUrl, duration: responseDuration ?? 0 };
    }

    throw new Error('Chatterbox response did not include audio data.');
  }

  async generateMusic(_config: AppConfig, _story: Story): Promise<string> {
    throw new Error('Chatterbox provider supports narration only. Use ComfyUI for music.');
  }
}
