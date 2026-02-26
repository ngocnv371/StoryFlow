import { AppConfig, Story, StoryGenerationOverrides, StoryMetadata } from '../types';

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
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
      width: typeof coverRaw?.width === 'number' ? coverRaw.width : legacyWidth,
      height: typeof coverRaw?.height === 'number' ? coverRaw.height : legacyHeight,
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
      width: overrides.cover?.width ?? config.imageGen.width,
      height: overrides.cover?.height ?? config.imageGen.height,
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
