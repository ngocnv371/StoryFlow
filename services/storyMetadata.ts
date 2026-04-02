import { AppConfig, Story, StoryGenerationOverrides, StoryMetadata, StoryRow, StoryTranscriptForm } from '../types';
import { deriveGeminiStandardAspectRatio, isGeminiStandardAspectRatio } from '../constants';

export const DEFAULT_STORY_THUMBNAIL_URL = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop';

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const countWords = (text: string): number => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};

const toOptionalText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.trim().length > 0 ? value : undefined;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
};

const toStoryTranscriptForm = (value: unknown): StoryTranscriptForm => {
  if (value === 'short') {
    return 'short';
  }

  return 'long';
};

const sanitizeStoryMetadata = (value: unknown): StoryMetadata => {
  const metadata = asObject(value) ?? {};
  const transcript = typeof metadata.transcript === 'string' ? metadata.transcript : '';
  const wordCount = typeof metadata.word_count === 'number' && Number.isFinite(metadata.word_count)
    ? metadata.word_count
    : countWords(transcript);

  return {
    ...metadata,
    summary: typeof metadata.summary === 'string' ? metadata.summary : '',
    transcript,
    word_count: wordCount,
    transcript_form: toStoryTranscriptForm(metadata.transcript_form),
    cover_prompt: toOptionalText(metadata.cover_prompt),
    narrator: toOptionalText(metadata.narrator),
    music: toOptionalText(metadata.music),
    thumbnail_url: toOptionalText(metadata.thumbnail_url) ?? DEFAULT_STORY_THUMBNAIL_URL,
    audio_url: toOptionalText(metadata.audio_url),
    duration: toOptionalNumber(metadata.duration),
    music_url: toOptionalText(metadata.music_url),
    video_url: toOptionalText(metadata.video_url),
  };
};

export const normalizeStoryRow = (row: StoryRow): Story => {
  const metadata = sanitizeStoryMetadata(row.metadata);

  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    metadata,
    summary: metadata.summary ?? '',
    transcript: metadata.transcript ?? '',
    word_count: metadata.word_count ?? 0,
    cover_prompt: metadata.cover_prompt,
    narrator: metadata.narrator,
    music: metadata.music,
    thumbnail_url: metadata.thumbnail_url ?? DEFAULT_STORY_THUMBNAIL_URL,
    audio_url: metadata.audio_url,
    duration: metadata.duration,
    music_url: metadata.music_url,
    video_url: metadata.video_url,
  };
};

export const serializeStoryMetadata = (story: Pick<Story, 'summary' | 'transcript' | 'word_count' | 'cover_prompt' | 'narrator' | 'music' | 'thumbnail_url' | 'audio_url' | 'duration' | 'music_url' | 'video_url' | 'metadata'>): StoryMetadata => {
  const existingMetadata = asObject(story.metadata) ?? {};
  const transcript = typeof story.transcript === 'string' ? story.transcript : '';

  return {
    ...existingMetadata,
    summary: story.summary,
    transcript,
    word_count: typeof story.word_count === 'number' && Number.isFinite(story.word_count)
      ? story.word_count
      : countWords(transcript),
    cover_prompt: toOptionalText(story.cover_prompt),
    narrator: toOptionalText(story.narrator),
    music: toOptionalText(story.music),
    thumbnail_url: toOptionalText(story.thumbnail_url) ?? DEFAULT_STORY_THUMBNAIL_URL,
    audio_url: toOptionalText(story.audio_url),
    duration: toOptionalNumber(story.duration),
    music_url: toOptionalText(story.music_url),
    video_url: toOptionalText(story.video_url),
  };
};

export const createStoryDraft = (overrides: Partial<StoryMetadata> = {}): StoryMetadata => {
  return sanitizeStoryMetadata(overrides);
};

export const getStoryGenerationOverrides = (story: Story): StoryGenerationOverrides => {
  const metadata = asObject(story.metadata);
  const rawOverrides = asObject(metadata?.generationOverrides);

  const legacyVoice = typeof metadata?.voice === 'string' ? metadata.voice : undefined;
  const legacySpeed = typeof metadata?.speed === 'number' ? metadata.speed : undefined;
  const legacyWidth = typeof metadata?.width === 'number' ? metadata.width : undefined;
  const legacyHeight = typeof metadata?.height === 'number' ? metadata.height : undefined;
  const legacyKenBurns = typeof metadata?.enableKenBurns === 'boolean' ? metadata.enableKenBurns : undefined;
  const legacyParticles = typeof metadata?.enableParticles === 'boolean' ? metadata.enableParticles : undefined;

  const coverRaw = asObject(rawOverrides?.cover);
  const narrationRaw = asObject(rawOverrides?.narration);
  const videoRaw = asObject(rawOverrides?.video);

  return {
    cover: {
      aspectRatio: (() => {
        const coverAspectRatio = coverRaw?.aspectRatio;
        if (isGeminiStandardAspectRatio(coverAspectRatio)) {
          return coverAspectRatio;
        }

        return deriveGeminiStandardAspectRatio(legacyWidth, legacyHeight);
      })(),
    },
    narration: {
      voice: typeof narrationRaw?.voice === 'string' ? narrationRaw.voice : legacyVoice,
      speed: typeof narrationRaw?.speed === 'number' ? narrationRaw.speed : legacySpeed,
    },
    video: {
      enableKenBurns: typeof videoRaw?.enableKenBurns === 'boolean' ? videoRaw.enableKenBurns : legacyKenBurns,
      enableParticles: typeof videoRaw?.enableParticles === 'boolean' ? videoRaw.enableParticles : legacyParticles,
    },
  };
};

export const resolveStoryConfig = (config: AppConfig, story: Story): AppConfig => {
  const overrides = getStoryGenerationOverrides(story);

  return {
    ...config,
    imageGen: {
      ...config.imageGen,
      aspectRatio: overrides.cover?.aspectRatio ?? config.imageGen.aspectRatio,
    },
    audioGen: {
      ...config.audioGen,
      voice: overrides.narration?.voice ?? config.audioGen.voice,
      speed: overrides.narration?.speed ?? config.audioGen.speed,
    },
    video: {
      ...config.video,
      enableKenBurns: overrides.video?.enableKenBurns ?? config.video.enableKenBurns,
      enableParticles: overrides.video?.enableParticles ?? config.video.enableParticles,
    },
  };
};

export const buildStoryGenerationOverridesFromConfig = (config: AppConfig): StoryGenerationOverrides => {
  return {
    cover: {
      aspectRatio: config.imageGen.aspectRatio,
    },
    narration: {
      voice: config.audioGen.voice,
      speed: config.audioGen.speed,
    },
    video: {
      enableKenBurns: config.video.enableKenBurns,
      enableParticles: config.video.enableParticles,
    },
  };
};

export const buildStoryGenerationOverridesSnapshot = (config: AppConfig, story: Story): StoryGenerationOverrides => {
  const effectiveConfig = resolveStoryConfig(config, story);
  return buildStoryGenerationOverridesFromConfig(effectiveConfig);
};

export const withStoryGenerationOverrides = (
  story: Story,
  overrides: StoryGenerationOverrides,
): StoryMetadata => {
  const metadata = asObject(story.metadata) ?? {};

  return {
    ...metadata,
    generationOverrides: overrides,
  };
};
