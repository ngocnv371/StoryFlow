import { AppConfig, Story } from '../../../types';
import { SUPABASE_AUDIO_BUCKET, uploadBase64ToSupabase, uploadToSupabase } from '../storage';
import { AIGenerationFactory, GeneratedAudio, GeneratedStoryText } from '../types';
import { TRANSCRIPT_SOFT_LIMIT } from '@/constants';
import { runAsyncJob } from '../asyncJob';

type ChatterboxJsonResponse = {
  __resolvedAudio?: GeneratedAudio;
  id?: string;
  jobId?: string;
  job_id?: string;
  predictionId?: string;
  prediction_id?: string;
  status?: string;
  statusUrl?: string;
  status_url?: string;
  resultUrl?: string;
  result_url?: string;
  outputUrl?: string;
  output_url?: string;
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
const CHATTERBOX_LOG_PREFIX = '[Chatterbox]';

const asNonEmptyString = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

const asPositiveNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
};

const asAbsoluteUrl = (value: string, endpoint: string): string => {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return new URL(value, endpoint).toString();
};

const buildLongSpeechUrl = (endpoint: string, jobId?: string): string => {
  const url = new URL(endpoint);
  const basePath = '/audio/speech/long';
  url.pathname = jobId ? `${basePath}/${encodeURIComponent(jobId)}` : basePath;
  url.search = '';
  url.hash = '';
  return url.toString();
};

const buildLongSpeechDownloadUrl = (endpoint: string, jobId: string): string => {
  const url = new URL(endpoint);
  const basePath = '/audio/speech/long';
  url.pathname = `${basePath}/${encodeURIComponent(jobId)}/download`;
  url.search = '';
  url.hash = '';
  return url.toString();
};

const getChatterboxJobId = (value: ChatterboxJsonResponse): string | null => {
  return (
    asNonEmptyString(value.job_id) ||
    asNonEmptyString(value.jobId) ||
    asNonEmptyString(value.prediction_id) ||
    asNonEmptyString(value.predictionId) ||
    asNonEmptyString(value.id)
  );
};

const hasFailedStatus = (payload: ChatterboxJsonResponse): boolean => {
  const status = asNonEmptyString(payload.status)?.toLowerCase();
  if (!status) {
    return false;
  }

  return status.includes('error') || status.includes('fail') || status.includes('cancel');
};

const hasCompletedStatus = (payload: ChatterboxJsonResponse): boolean => {
  const status = asNonEmptyString(payload.status)?.toLowerCase();
  return status === 'completed';
};

const resolveAudioFromPayload = async (
  payload: ChatterboxJsonResponse,
  story: Story,
): Promise<GeneratedAudio | null> => {
  if (payload.__resolvedAudio) {
    return payload.__resolvedAudio;
  }

  const responseDuration = asPositiveNumber(payload.duration) ?? asPositiveNumber(payload.durationSeconds);

  const directUrl =
    asNonEmptyString(payload.audioUrl) ||
    asNonEmptyString(payload.url) ||
    asNonEmptyString(payload.result_url) ||
    asNonEmptyString(payload.resultUrl) ||
    asNonEmptyString(payload.output_url) ||
    asNonEmptyString(payload.outputUrl);
  if (directUrl) {
    try {
      const audioResponse = await fetch(directUrl);
      if (!audioResponse.ok) {
        throw new Error();
      }

      const audioBlob = await audioResponse.blob();
      const audioMime = audioBlob.type || 'audio/mpeg';
      const extension = audioMime.includes('wav') ? 'wav' : audioMime.includes('ogg') ? 'ogg' : 'mp3';
      const uploadedUrl = await uploadToSupabase(SUPABASE_AUDIO_BUCKET, `${story.id}.${extension}`, audioBlob, audioMime);
      const estimatedDuration = (await estimateDurationFromBlob(audioBlob)) ?? 0;
      return { url: uploadedUrl, duration: responseDuration ?? estimatedDuration };
    } catch {
      return { url: directUrl, duration: responseDuration ?? 0 };
    }
  }

  const base64Audio = asNonEmptyString(payload.audioBase64) || asNonEmptyString(payload.base64);
  if (base64Audio) {
    const audioMime = asNonEmptyString(payload.mimeType) || asNonEmptyString(payload.contentType) || 'audio/wav';
    const extension = audioMime.includes('wav') ? 'wav' : audioMime.includes('ogg') ? 'ogg' : 'mp3';
    const uploadedUrl = await uploadBase64ToSupabase(SUPABASE_AUDIO_BUCKET, `${story.id}.${extension}`, base64Audio, audioMime);
    return { url: uploadedUrl, duration: responseDuration ?? 0 };
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

  async generateImagePrompts(_config: AppConfig, _story: Story, _numberOfPrompts: number): Promise<string[]> {
    throw new Error('Chatterbox provider supports narration only. Use Gemini for image prompts.');
  }

  async generateImage(_config: AppConfig, _story: Story): Promise<string> {
    throw new Error('Chatterbox provider supports narration only. Use Gemini or ComfyUI for images.');
  }

  async generateAudio(config: AppConfig, story: Story): Promise<GeneratedAudio> {
    const endpoint = config.chatterbox.endpoint.trim();
    if (!endpoint) {
      throw new Error('Chatterbox endpoint is required for narration generation.');
    }

    const fullTranscript = story.transcript.trim();
    const isLongTranscript = fullTranscript.length > TRANSCRIPT_SOFT_LIMIT;
    const transcript = isLongTranscript ? fullTranscript : fullTranscript.substring(0, TRANSCRIPT_SOFT_LIMIT);
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
    const model = config.chatterbox.model || DEFAULT_MODEL;

    console.debug(
      `${CHATTERBOX_LOG_PREFIX} generateAudio start`,
      {
        storyId: story.id,
        transcriptLength: fullTranscript.length,
        softLimit: TRANSCRIPT_SOFT_LIMIT,
        mode: isLongTranscript ? 'async-job' : 'direct',
        voice,
        speed,
        model,
      },
    );

    const requestAudio = async (): Promise<GeneratedAudio> => {
      console.debug(`${CHATTERBOX_LOG_PREFIX} direct request start`, { storyId: story.id, endpoint });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          input: transcript,
          voice,
          speed,
          model,
        }),
      });

      console.debug(`${CHATTERBOX_LOG_PREFIX} direct request response`, {
        storyId: story.id,
        status: response.status,
        contentType: response.headers.get('content-type')?.toLowerCase() || '',
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
        console.debug(`${CHATTERBOX_LOG_PREFIX} direct audio stream received`, { storyId: story.id, contentType });
        const audioBlob = await response.blob();
        const extension = contentType.includes('wav') ? 'wav' : contentType.includes('ogg') ? 'ogg' : 'mp3';
        const audioUrl = await uploadToSupabase(SUPABASE_AUDIO_BUCKET, `${story.id}.${extension}`, audioBlob, contentType);
        const duration = (await estimateDurationFromBlob(audioBlob)) ?? 0;
        return { url: audioUrl, duration };
      }

      const payload = (await response.json()) as ChatterboxJsonResponse;
      console.debug(`${CHATTERBOX_LOG_PREFIX} direct json payload received`, {
        storyId: story.id,
        hasJobId: Boolean(getChatterboxJobId(payload)),
        status: payload.status ?? null,
      });
      const immediateResult = await resolveAudioFromPayload(payload, story);
      if (immediateResult) {
        console.debug(`${CHATTERBOX_LOG_PREFIX} direct request resolved from payload`, { storyId: story.id });
        return immediateResult;
      }

      throw new Error('Chatterbox response did not include audio data.');
    };

    if (!isLongTranscript) {
      return await requestAudio();
    }

    const longCreateUrl = buildLongSpeechUrl(endpoint);
    console.debug(`${CHATTERBOX_LOG_PREFIX} async job flow selected`, { storyId: story.id, endpoint: longCreateUrl });

    return await runAsyncJob<ChatterboxJsonResponse, ChatterboxJsonResponse, GeneratedAudio>({
      createJob: async () => {
        console.debug(`${CHATTERBOX_LOG_PREFIX} async create job start`, { storyId: story.id, endpoint: longCreateUrl });

        const response = await fetch(longCreateUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            input: transcript,
            voice,
            speed,
            model,
          }),
        });

        console.debug(`${CHATTERBOX_LOG_PREFIX} async create job response`, {
          storyId: story.id,
          status: response.status,
          contentType: response.headers.get('content-type')?.toLowerCase() || '',
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
          console.debug(`${CHATTERBOX_LOG_PREFIX} async create returned audio directly`, { storyId: story.id, contentType });
          const audioBlob = await response.blob();
          const extension = contentType.includes('wav') ? 'wav' : contentType.includes('ogg') ? 'ogg' : 'mp3';
          const audioUrl = await uploadToSupabase(SUPABASE_AUDIO_BUCKET, `${story.id}.${extension}`, audioBlob, contentType);
          const duration = (await estimateDurationFromBlob(audioBlob)) ?? 0;
          return { url: audioUrl, duration };
        }

        const payload = (await response.json()) as ChatterboxJsonResponse;
        console.debug(`${CHATTERBOX_LOG_PREFIX} async create returned json payload`, {
          storyId: story.id,
          jobId: getChatterboxJobId(payload),
          status: payload.status ?? null,
        });
        return payload;
      },
      getJobId: (createResponse) => getChatterboxJobId(createResponse),
      getImmediateResult: async (createResponse) => {
        return await resolveAudioFromPayload(createResponse, story);
      },
      fetchStatus: async (jobId) => {
        const statusUrl = buildLongSpeechUrl(endpoint, jobId);
        console.debug(`${CHATTERBOX_LOG_PREFIX} polling status`, { storyId: story.id, jobId, statusUrl });

        const statusResponse = await fetch(statusUrl, {
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

          console.warn(`${CHATTERBOX_LOG_PREFIX} status request non-2xx`, {
            storyId: story.id,
            jobId,
            statusUrl,
            status: statusResponse.status,
          });

          throw new Error(`Chatterbox status request failed (${statusResponse.status}) at ${statusUrl}${details}`);
        }

        const contentType = statusResponse.headers.get('content-type')?.toLowerCase() || '';
        if (contentType.startsWith('audio/')) {
          console.debug(`${CHATTERBOX_LOG_PREFIX} status returned audio stream`, { storyId: story.id, jobId, statusUrl, contentType });
          const audioBlob = await statusResponse.blob();
          const extension = contentType.includes('wav') ? 'wav' : contentType.includes('ogg') ? 'ogg' : 'mp3';
          const audioUrl = await uploadToSupabase(SUPABASE_AUDIO_BUCKET, `${story.id}.${extension}`, audioBlob, contentType);
          const duration = (await estimateDurationFromBlob(audioBlob)) ?? 0;
          return { __resolvedAudio: { url: audioUrl, duration } };
        }

        const payload = (await statusResponse.json()) as ChatterboxJsonResponse;
        console.debug(`${CHATTERBOX_LOG_PREFIX} status payload received`, {
          storyId: story.id,
          jobId,
          statusUrl,
          status: payload.status ?? null,
        });

        if (hasCompletedStatus(payload)) {
          const downloadUrl = buildLongSpeechDownloadUrl(endpoint, jobId);
          console.debug(`${CHATTERBOX_LOG_PREFIX} status indicates completed; downloading result`, { storyId: story.id, jobId, downloadUrl });
          const downloadResponse = await fetch(downloadUrl, {
            method: 'GET',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });

          if (!downloadResponse.ok) {
            let details = '';
            try {
              const body = await downloadResponse.text();
              details = body ? ` - ${body}` : '';
            } catch {
            }
            throw new Error(`Chatterbox download failed (${downloadResponse.status}) at ${downloadUrl}${details}`);
          }

          const downloadContentType = downloadResponse.headers.get('content-type')?.toLowerCase() || '';
          if (downloadContentType.startsWith('audio/')) {
            const audioBlob = await downloadResponse.blob();
            const extension = downloadContentType.includes('wav') ? 'wav' : downloadContentType.includes('ogg') ? 'ogg' : 'mp3';
            const audioUrl = await uploadToSupabase(SUPABASE_AUDIO_BUCKET, `${story.id}.${extension}`, audioBlob, downloadContentType);
            const duration = (await estimateDurationFromBlob(audioBlob)) ?? 0;
            return { __resolvedAudio: { url: audioUrl, duration } };
          }

          let details = '';
          try {
            const body = await downloadResponse.text();
            details = body ? ` - ${body}` : '';
          } catch {
          }
          throw new Error(`Chatterbox download did not return audio at ${downloadUrl}${details}`);
        }

        return payload;
      },
      getStatusResult: async (statusResponse, _jobId) => {
        return await resolveAudioFromPayload(statusResponse, story);
      },
      hasFailedStatus: (statusResponse) => hasFailedStatus(statusResponse),
      getFailureMessage: () => 'Chatterbox generation failed.',
      maxPollAttempts: 1300,
      pollIntervalMs: 5000,
      delayBeforeFirstPoll: true,
      missingJobIdError: 'Chatterbox response did not include audio data or job id for polling.',
      timeoutError: (jobId) => `Timed out waiting for Chatterbox audio output for job ${jobId}.`,
    });
  }

  async generateMusic(_config: AppConfig, _story: Story): Promise<string> {
    throw new Error('Chatterbox provider supports narration only. Use ComfyUI for music.');
  }
}
