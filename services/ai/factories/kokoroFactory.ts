import { AppConfig, Story } from '../../../types';
import { uploadBase64ToSupabase, uploadToSupabase } from '../storage';
import { AIGenerationFactory, GeneratedAudio, GeneratedStoryText } from '../types';
import { TRANSCRIPT_SOFT_LIMIT } from '@/constants';
import { runAsyncJob } from '../asyncJob';

type KokoroJsonResponse = {
  id?: string;
  status?: string;
  output?: string | string[];
  output_url?: string;
  audio_url?: string;
  base64?: string;
  audioBase64?: string;
  mimeType?: string;
  contentType?: string;
  duration?: number;
  durationSeconds?: number;
};

const KOKORO_POLL_INTERVAL_MS = 1200;
const KOKORO_MAX_POLL_ATTEMPTS = 90;

const asNonEmptyString = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

const asPositiveNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
};

const isAudioDataUri = (value: string): boolean => {
  return /^data:audio\/[a-z0-9.+-]+;base64,/i.test(value);
};

const toAbsoluteUrl = (value: string, endpoint: string): string => {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return new URL(value, endpoint).toString();
};

const extractOutputUrl = (data: KokoroJsonResponse, endpoint: string): string | null => {
  const direct =
    asNonEmptyString(data.audio_url) ||
    asNonEmptyString(data.output_url) ||
    asNonEmptyString(data.output);
  if (direct && !isAudioDataUri(direct)) {
    return toAbsoluteUrl(direct, endpoint);
  }

  if (Array.isArray(data.output)) {
    const first = data.output.find((item) => typeof item === 'string' && item.trim().length > 0);
    if (first && !isAudioDataUri(first)) {
      return toAbsoluteUrl(first, endpoint);
    }
  }

  return null;
};

const extractOutputDataUri = (data: KokoroJsonResponse): string | null => {
  const directOutput = asNonEmptyString(data.output);
  if (directOutput && isAudioDataUri(directOutput)) {
    return directOutput;
  }

  if (Array.isArray(data.output)) {
    const dataUri = data.output.find((item) => typeof item === 'string' && isAudioDataUri(item));
    if (dataUri) {
      return dataUri;
    }
  }

  return null;
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

const getPredictionStatusUrl = (endpoint: string, id: string): string => {
  const endpointUrl = new URL(endpoint);
  const trimmedPath = endpointUrl.pathname.replace(/\/+$/, '');
  const predictionBasePath = trimmedPath.endsWith('/predictions')
    ? trimmedPath
    : trimmedPath.endsWith('/predictions/')
      ? trimmedPath.replace(/\/+$/, '')
      : '/predictions';
  endpointUrl.pathname = `${predictionBasePath}/${encodeURIComponent(id)}`;
  endpointUrl.search = '';
  endpointUrl.hash = '';
  return endpointUrl.toString();
};

type KokoroCreateResponse = {
  payload: KokoroJsonResponse | null;
  directAudio: GeneratedAudio | null;
  responseDuration: number | null;
};

const resolveAudioFromKokoroPayload = async (
  payload: KokoroJsonResponse,
  endpoint: string,
  story: Story,
  fallbackDuration: number | null,
): Promise<GeneratedAudio | null> => {
  const payloadDuration = asPositiveNumber(payload.duration) ?? asPositiveNumber(payload.durationSeconds);

  const outputDataUri = extractOutputDataUri(payload);
  if (outputDataUri) {
    const uploadedUrl = await uploadBase64ToSupabase('audio', `${story.id}.wav`, outputDataUri, 'audio/wav');
    return { url: uploadedUrl, duration: payloadDuration ?? fallbackDuration ?? 0 };
  }

  const outputUrl = extractOutputUrl(payload, endpoint);
  if (outputUrl) {
    try {
      const audioResponse = await fetch(outputUrl);
      if (!audioResponse.ok) {
        throw new Error();
      }

      const audioBlob = await audioResponse.blob();
      const audioMime = audioBlob.type || 'audio/wav';
      const extension = audioMime.includes('wav') ? 'wav' : audioMime.includes('ogg') ? 'ogg' : 'mp3';
      const uploadedUrl = await uploadToSupabase('audio', `${story.id}.${extension}`, audioBlob, audioMime);
      const estimatedDuration = (await estimateDurationFromBlob(audioBlob)) ?? 0;
      return { url: uploadedUrl, duration: payloadDuration ?? fallbackDuration ?? estimatedDuration };
    } catch {
      return { url: outputUrl, duration: payloadDuration ?? fallbackDuration ?? 0 };
    }
  }

  const base64Audio = asNonEmptyString(payload.audioBase64) || asNonEmptyString(payload.base64);
  if (base64Audio) {
    const audioMime = asNonEmptyString(payload.mimeType) || asNonEmptyString(payload.contentType) || 'audio/wav';
    const extension = audioMime.includes('wav') ? 'wav' : audioMime.includes('ogg') ? 'ogg' : 'mp3';
    const uploadedUrl = await uploadBase64ToSupabase('audio', `${story.id}.${extension}`, base64Audio, audioMime);
    return { url: uploadedUrl, duration: payloadDuration ?? fallbackDuration ?? 0 };
  }

  return null;
};

export class KokoroAIGenerationFactory implements AIGenerationFactory {
  async generateText(_config: AppConfig, _storyDetails: Story): Promise<GeneratedStoryText> {
    throw new Error('Kokoro provider supports narration only. Use Gemini or OpenAI compatible for text.');
  }

  async extendTranscript(_config: AppConfig, _tags: string[], _transcript: string): Promise<string> {
    throw new Error('Kokoro provider supports narration only. Use Gemini or OpenAI compatible for text.');
  }

  async generateProjectIdeas(_config: AppConfig, _theme: string): Promise<string[]> {
    throw new Error('Kokoro provider supports narration only. Use Gemini or OpenAI compatible for text.');
  }

  async generateImage(_config: AppConfig, _story: Story): Promise<string> {
    throw new Error('Kokoro provider supports narration only. Use Gemini or ComfyUI for images.');
  }

  async generateAudio(config: AppConfig, story: Story): Promise<GeneratedAudio> {
    const endpoint = config.kokoro.endpoint.trim();
    if (!endpoint) {
      throw new Error('Kokoro endpoint is required for narration generation.');
    }

    const transcript = story.transcript.substring(0, TRANSCRIPT_SOFT_LIMIT).trim();
    if (!transcript) {
      throw new Error('Transcript is required before generating narration.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = config.kokoro.token.trim();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const voice = (config.audioGen.voice || (story.metadata?.voice as string) || 'af_bella').trim();
    const speed = config.audioGen.speed ?? 1;

    return await runAsyncJob<KokoroCreateResponse, KokoroJsonResponse, GeneratedAudio>({
      createJob: async () => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            input: {
              text: transcript,
              voice,
              speed,
            }
          }),
        });

        if (!response.ok) {
          let details = '';
          try {
            const body = await response.text();
            details = body ? ` - ${body}` : '';
          } catch {
          }
          throw new Error(`Kokoro request failed (${response.status})${details}`);
        }

        const contentType = response.headers.get('content-type')?.toLowerCase() || '';
        if (contentType.startsWith('audio/')) {
          const audioBlob = await response.blob();
          const extension = contentType.includes('wav') ? 'wav' : contentType.includes('ogg') ? 'ogg' : 'mp3';
          const audioUrl = await uploadToSupabase('audio', `${story.id}.${extension}`, audioBlob, contentType);
          const duration = (await estimateDurationFromBlob(audioBlob)) ?? 0;
          return {
            payload: null,
            directAudio: { url: audioUrl, duration },
            responseDuration: duration,
          };
        }

        const payload = (await response.json()) as KokoroJsonResponse;
        const responseDuration = asPositiveNumber(payload.duration) ?? asPositiveNumber(payload.durationSeconds);
        return {
          payload,
          directAudio: null,
          responseDuration,
        };
      },
      getJobId: (createResponse) => asNonEmptyString(createResponse.payload?.id),
      getImmediateResult: async (createResponse) => {
        if (createResponse.directAudio) {
          return createResponse.directAudio;
        }

        if (!createResponse.payload) {
          return null;
        }

        return await resolveAudioFromKokoroPayload(
          createResponse.payload,
          endpoint,
          story,
          createResponse.responseDuration,
        );
      },
      fetchStatus: async (jobId) => {
        const statusResponse = await fetch(getPredictionStatusUrl(endpoint, jobId), {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!statusResponse.ok) {
          let details = '';
          try {
            const body = await statusResponse.text();
            details = body ? ` - ${body}` : '';
          } catch {
          }
          throw new Error(`Kokoro status request failed (${statusResponse.status})${details}`);
        }

        return (await statusResponse.json()) as KokoroJsonResponse;
      },
      getStatusResult: async (statusResponse, _jobId) => {
        const responseDuration = asPositiveNumber(statusResponse.duration) ?? asPositiveNumber(statusResponse.durationSeconds);
        return await resolveAudioFromKokoroPayload(statusResponse, endpoint, story, responseDuration);
      },
      hasFailedStatus: (statusResponse) => {
        const status = asNonEmptyString(statusResponse.status)?.toLowerCase();
        return status === 'failed' || status === 'error' || status === 'canceled' || status === 'cancelled';
      },
      getFailureMessage: () => 'Kokoro generation failed.',
      maxPollAttempts: KOKORO_MAX_POLL_ATTEMPTS,
      pollIntervalMs: KOKORO_POLL_INTERVAL_MS,
      delayBeforeFirstPoll: true,
      missingJobIdError: 'Kokoro response did not include audio output or prediction id.',
      timeoutError: () => 'Timed out waiting for Kokoro audio output.',
    });
  }

  async generateMusic(_config: AppConfig, _story: Story): Promise<string> {
    throw new Error('Kokoro provider supports narration only. Use ComfyUI for music.');
  }
}
