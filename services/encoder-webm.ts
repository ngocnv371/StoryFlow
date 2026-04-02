import {
  Output,
  BufferTarget,
  Mp4OutputFormat,
  CanvasSource,
  AudioBufferSource,
  QUALITY_HIGH,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
  OutputFormat,
} from 'mediabunny';

interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  audioBitrate: number;
  audioSampleRate: number;
  audioChannels: number;
}

interface CompileRenderOptions {
  enableKenBurns?: boolean;
  enableParticles?: boolean;
  fps?: number;
  frameDuration?: number;
  imageUrls?: string[];
}

interface CompileArgsResolved {
  backgroundMusicUrl?: string;
  onProgress?: (progress: number) => void;
  renderOptions: Required<Omit<CompileRenderOptions, 'imageUrls'>> & { imageUrls?: string[] };
}

interface CoverPlacement {
  drawWidth: number;
  drawHeight: number;
  drawX: number;
  drawY: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
  drift: number;
  phase: number;
}

const DEFAULT_CONFIG: VideoConfig = {
  width: 1280,
  height: 720,
  fps: 24,
  bitrate: 8000000,
  audioBitrate: 128000,
  audioSampleRate: 48000,
  audioChannels: 2,
};

const DEFAULT_RENDER_OPTIONS: Required<Omit<CompileRenderOptions, 'imageUrls'>> = {
  enableKenBurns: true,
  enableParticles: true,
  fps: 24,
  frameDuration: 3000,
};

/**
 * Load and decode audio from URL
 */
async function loadAndDecodeAudio(audioUrl: string): Promise<AudioBuffer> {
  console.log('🎵 Loading audio from URL:', audioUrl);
  
  try {
    // Fetch audio data
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log(`🎵 Audio fetched: ${arrayBuffer.byteLength} bytes`);
    
    // Decode audio
    const audioContext = new AudioContext({ sampleRate: DEFAULT_CONFIG.audioSampleRate });
    console.log(`🎵 AudioContext created: ${audioContext.sampleRate}Hz, ${audioContext.state}`);
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log(`🎵 Audio decoded successfully:`);
    console.log(`   - Duration: ${audioBuffer.duration}s`);
    console.log(`   - Sample rate: ${audioBuffer.sampleRate}Hz`);
    console.log(`   - Channels: ${audioBuffer.numberOfChannels}`);
    console.log(`   - Length: ${audioBuffer.length} samples`);
    
    // Clean up audio context
    await audioContext.close();
    
    return audioBuffer;
    
  } catch (error) {
    console.error('🚨 Audio loading failed:', error);
    throw new Error(`Failed to load audio: ${error.message}`);
  }
}


/**
 * Using Mediabunny to compile a video from a cover image and audio track.
 * The output video length will match the audio duration, and the cover image will be displayed throughout the video.
 * If imageUrls is provided in options, the video will cycle through multiple images.
 */
export async function compileStoryVideo(
  coverImageUrl: string, 
  audioUrl: string,
  backgroundMusicUrlOrProgressOrOptions?: string | ((progress: number) => void) | CompileRenderOptions,
  onProgressOrOptionsMaybe?: ((progress: number) => void) | CompileRenderOptions,
  optionsMaybe?: CompileRenderOptions
): Promise<Blob> {
  const { backgroundMusicUrl, onProgress, renderOptions } = resolveCompileArgs(
    backgroundMusicUrlOrProgressOrOptions,
    onProgressOrOptionsMaybe,
    optionsMaybe
  );

  const effectiveFps = renderOptions.fps || DEFAULT_CONFIG.fps;
  const effectiveFrameDuration = renderOptions.frameDuration || DEFAULT_RENDER_OPTIONS.frameDuration;
  
  console.log('🚀 Starting video compilation...');
  console.log(`📄 Cover image URL: ${coverImageUrl}`);
  console.log(`🎵 Audio URL: ${audioUrl}`);
  if (backgroundMusicUrl) {
    console.log(`🎶 Background music URL: ${backgroundMusicUrl}`);
  }

  try {
    const additionalImageUrls = renderOptions.imageUrls ?? [];
    const allImageUrls = additionalImageUrls.length > 0 ? additionalImageUrls : [coverImageUrl];
    
    // Load all images and audio in parallel
    const [images, audioBuffer, backgroundMusicBuffer] = await Promise.all([
      Promise.all(allImageUrls.map(url => loadImage(url))),
      loadAndDecodeAudio(audioUrl),
      backgroundMusicUrl ? loadAndDecodeAudio(backgroundMusicUrl) : Promise.resolve(null),
    ]);

    const duration = audioBuffer.duration;
    const mixedAudioBuffer = backgroundMusicBuffer
      ? await mixNarrationWithBackgroundMusic(audioBuffer, backgroundMusicBuffer, DEFAULT_CONFIG.audioSampleRate)
      : audioBuffer;

    const totalFrames = Math.ceil(duration * effectiveFps);
    const framesPerImage = Math.max(1, Math.round((effectiveFrameDuration / 1000) * effectiveFps));
    
    console.log(`🎬 Video will be ${duration.toFixed(2)}s long (${totalFrames} frames at ${effectiveFps}fps)`);
    console.log(`🖼️ Cycling through ${images.length} image(s), ${framesPerImage} frames each`);

    // Create canvas for rendering
    const canvas = new OffscreenCanvas(DEFAULT_CONFIG.width, DEFAULT_CONFIG.height);
    const ctx = canvas.getContext('2d', { alpha: false })!;

    // Pre-compute placement for each image
    const placements = images.map(img => calculateCoverPlacement(img, DEFAULT_CONFIG.width, DEFAULT_CONFIG.height));

    // Ken Burns paths per image so each has its own animation
    const kenBurnsPaths = images.map(() => createKenBurnsPath());

    const particles = renderOptions.enableParticles
      ? createParticles(DEFAULT_CONFIG.width, DEFAULT_CONFIG.height)
      : [];

    // Create output
    const output = new Output({
      target: new BufferTarget(),
      format: new Mp4OutputFormat(),
    });

    // Get video codec
    const videoCodec = await getFirstEncodableVideoCodec(output.format.getSupportedVideoCodecs(), {
      width: DEFAULT_CONFIG.width,
      height: DEFAULT_CONFIG.height,
    });
    if (!videoCodec) {
      throw new Error('Your browser doesn\'t support video encoding.');
    }

    // Create canvas source for video
    const canvasSource = new CanvasSource(canvas, {
      codec: videoCodec,
      bitrate: DEFAULT_CONFIG.bitrate,
    });
    output.addVideoTrack(canvasSource, { frameRate: effectiveFps });

    // Get audio codec and create audio source
    const audioCodec = await getFirstEncodableAudioCodec(output.format.getSupportedAudioCodecs(), {
      numberOfChannels: DEFAULT_CONFIG.audioChannels,
      sampleRate: DEFAULT_CONFIG.audioSampleRate,
    });
    
    let audioBufferSource: AudioBufferSource | null = null;
    if (audioCodec) {
      audioBufferSource = new AudioBufferSource({
        codec: audioCodec,
        bitrate: DEFAULT_CONFIG.audioBitrate,
      });
      output.addAudioTrack(audioBufferSource);
    } else {
      console.warn('⚠️ Audio codec not supported, video will have no audio');
    }

    // Start output
    await output.start();
    
    console.log('🎬 Rendering video frames...');
    
    // Render all frames
    for (let currentFrame = 0; currentFrame < totalFrames; currentFrame++) {
      const currentTime = currentFrame / effectiveFps;

      // Determine which image to show based on frameDuration
      const imageIndex = Math.floor(currentFrame / framesPerImage) % images.length;
      // Frame progress within the current image segment
      const frameWithinSegment = currentFrame % framesPerImage;

      renderFrame(ctx, {
        image: images[imageIndex],
        placement: placements[imageIndex],
        canvasWidth: DEFAULT_CONFIG.width,
        canvasHeight: DEFAULT_CONFIG.height,
        currentFrame: frameWithinSegment,
        totalFrames: framesPerImage,
        currentTime,
        particles,
        enableKenBurns: renderOptions.enableKenBurns,
        enableParticles: renderOptions.enableParticles,
        kenBurnsPath: kenBurnsPaths[imageIndex],
      });
      
      await canvasSource.add(currentTime, 1 / effectiveFps);
      
      // Report progress
      if (onProgress) {
        const videoProgress = currentFrame / totalFrames;
        const overallProgress = videoProgress * (audioBufferSource ? 0.8 : 0.9);
        onProgress(overallProgress);
      }
    }

    // Close video source
    canvasSource.close();
    console.log('✅ Video frames rendered');

    // Add audio if available
    if (audioBufferSource) {
      console.log('🎵 Adding audio track...');
      
      // Resample audio if needed
      const resampledAudio = await resampleAudioIfNeeded(mixedAudioBuffer, DEFAULT_CONFIG.audioSampleRate);
      await audioBufferSource.add(resampledAudio);
      audioBufferSource.close();
      
      console.log('✅ Audio track added');
    }

    // Finalize output
    if (onProgress) {
      onProgress(0.95);
    }
    
    console.log('🎬 Finalizing video...');
    await output.finalize();

    if (onProgress) {
      onProgress(1.0);
    }

    // Create and return blob
    const videoBlob = new Blob([output.target.buffer!], { type: output.format.mimeType });
    const fileSizeMiB = (videoBlob.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Video compilation complete! Size: ${fileSizeMiB} MiB`);
    
    return videoBlob;
    
  } catch (error) {
    console.error('🚨 Video compilation failed:', error);
    throw new Error(`Video compilation failed: ${error.message}`);
  }
}

function resolveCompileArgs(
  arg3?: string | ((progress: number) => void) | CompileRenderOptions,
  arg4?: ((progress: number) => void) | CompileRenderOptions,
  arg5?: CompileRenderOptions
): CompileArgsResolved {
  let backgroundMusicUrl: string | undefined;
  let onProgress: ((progress: number) => void) | undefined;
  let renderOptions: CompileRenderOptions | undefined;

  if (typeof arg3 === 'string') {
    backgroundMusicUrl = arg3;
  } else if (typeof arg3 === 'function') {
    onProgress = arg3;
  } else if (isCompileRenderOptions(arg3)) {
    renderOptions = arg3;
  }

  if (typeof arg4 === 'function') {
    onProgress = arg4;
  } else if (isCompileRenderOptions(arg4)) {
    renderOptions = arg4;
  }

  if (isCompileRenderOptions(arg5)) {
    renderOptions = arg5;
  }

  return {
    backgroundMusicUrl,
    onProgress,
    renderOptions: {
      ...DEFAULT_RENDER_OPTIONS,
      ...(renderOptions ?? {}),
    },
  };
}

function isCompileRenderOptions(value: unknown): value is CompileRenderOptions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeOptions = value as CompileRenderOptions;
  return (
    typeof maybeOptions.enableKenBurns === 'boolean' ||
    typeof maybeOptions.enableParticles === 'boolean' ||
    typeof maybeOptions.fps === 'number' ||
    typeof maybeOptions.frameDuration === 'number' ||
    Array.isArray(maybeOptions.imageUrls)
  );
}

/**
 * Enhanced image loading with detailed logging
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  console.log('🖼️ Loading image from:', url);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    const timeout = setTimeout(() => {
      console.error('🚨 Image loading timeout');
      reject(new Error('Image loading timeout'));
    }, 15000);
    
    img.onload = () => {
      clearTimeout(timeout);
      console.log(`✅ Image loaded successfully:`);
      console.log(`   - Dimensions: ${img.width}x${img.height}px`);
      console.log(`   - Natural size: ${img.naturalWidth}x${img.naturalHeight}px`);
      console.log(`   - Complete: ${img.complete}`);
      resolve(img);
    };
    
    img.onerror = (e) => {
      clearTimeout(timeout);
      console.error('🚨 Image loading failed:', e);
      reject(new Error('Failed to load image'));
    };
    
    img.crossOrigin = 'anonymous';
    img.src = url;
    
    console.log('🔄 Image element created and src set');
  });
}

/**
 * Draw cover image to canvas with proper scaling and centering
 */
function calculateCoverPlacement(
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
): CoverPlacement {
  // Calculate scaling to fit image while maintaining aspect ratio
  const imageAspect = img.width / img.height;
  const canvasAspect = canvasWidth / canvasHeight;
  
  let drawWidth: number;
  let drawHeight: number;
  let drawX: number;
  let drawY: number;
  
  if (imageAspect > canvasAspect) {
    // Image is wider - fit by width
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imageAspect;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    // Image is taller - fit by height
    drawWidth = canvasHeight * imageAspect;
    drawHeight = canvasHeight;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }
  
  console.log(`🖼️ Cover placement calculated:`);
  console.log(`   - Canvas: ${canvasWidth}x${canvasHeight}px`);
  console.log(`   - Image: ${img.width}x${img.height}px`);
  console.log(`   - Drawn: ${drawWidth.toFixed(0)}x${drawHeight.toFixed(0)}px at (${drawX.toFixed(0)}, ${drawY.toFixed(0)})`);

  return {
    drawWidth,
    drawHeight,
    drawX,
    drawY,
  };
}

function createKenBurnsPath() {
  const directions = [
    { startX: -1, startY: 0, endX: 1, endY: 0 },
    { startX: 1, startY: 0, endX: -1, endY: 0 },
    { startX: 0, startY: -1, endX: 0, endY: 1 },
    { startX: 0, startY: 1, endX: 0, endY: -1 },
  ];

  return directions[Math.floor(Math.random() * directions.length)];
}

function createParticles(canvasWidth: number, canvasHeight: number): Particle[] {
  const particleCount = Math.max(24, Math.floor((canvasWidth * canvasHeight) / 30000));
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      radius: 0.8 + Math.random() * 2.2,
      speed: 8 + Math.random() * 18,
      alpha: 0.03 + Math.random() * 0.09,
      drift: 0.2 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
    });
  }

  return particles;
}

function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function renderFrame(
  ctx: OffscreenCanvasRenderingContext2D,
  params: {
    image: HTMLImageElement;
    placement: CoverPlacement;
    canvasWidth: number;
    canvasHeight: number;
    currentFrame: number;
    totalFrames: number;
    currentTime: number;
    particles: Particle[];
    enableKenBurns: boolean;
    enableParticles: boolean;
    kenBurnsPath: { startX: number; startY: number; endX: number; endY: number };
  }
) {
  const {
    image,
    placement,
    canvasWidth,
    canvasHeight,
    currentFrame,
    totalFrames,
    currentTime,
    particles,
    enableKenBurns,
    enableParticles,
    kenBurnsPath,
  } = params;

  const frameProgress = totalFrames <= 1 ? 0 : currentFrame / (totalFrames - 1);
  const easedProgress = easeInOutSine(frameProgress);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const zoom = enableKenBurns ? lerp(1, 1.08, easedProgress) : 1;
  const scaledWidth = placement.drawWidth * zoom;
  const scaledHeight = placement.drawHeight * zoom;

  const maxOffsetX = Math.max(0, (scaledWidth - placement.drawWidth) / 2);
  const maxOffsetY = Math.max(0, (scaledHeight - placement.drawHeight) / 2);

  const panX = enableKenBurns
    ? lerp(kenBurnsPath.startX, kenBurnsPath.endX, easedProgress) * maxOffsetX * 0.8
    : 0;
  const panY = enableKenBurns
    ? lerp(kenBurnsPath.startY, kenBurnsPath.endY, easedProgress) * maxOffsetY * 0.8
    : 0;

  const drawX = placement.drawX - (scaledWidth - placement.drawWidth) / 2 + panX;
  const drawY = placement.drawY - (scaledHeight - placement.drawHeight) / 2 + panY;

  ctx.drawImage(image, drawX, drawY, scaledWidth, scaledHeight);

  if (enableParticles) {
    renderParticles(ctx, particles, currentTime, canvasWidth, canvasHeight);
  }
}

function renderParticles(
  ctx: OffscreenCanvasRenderingContext2D,
  particles: Particle[],
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number
) {
  for (const particle of particles) {
    const x = (particle.x + Math.sin(currentTime * 0.35 + particle.phase) * particle.drift * 26 + canvasWidth) % canvasWidth;
    const y = (particle.y - currentTime * particle.speed + canvasHeight) % canvasHeight;

    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha.toFixed(3)})`;
    ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Resample audio buffer if sample rate doesn't match target
 */
async function resampleAudioIfNeeded(
  audioBuffer: AudioBuffer, 
  targetSampleRate: number
): Promise<AudioBuffer> {
  
  if (audioBuffer.sampleRate === targetSampleRate) {
    console.log('🎵 Audio sample rate matches target, no resampling needed');
    return audioBuffer;
  }
  
  console.log(`🎵 Resampling audio from ${audioBuffer.sampleRate}Hz to ${targetSampleRate}Hz`);
  
  const audioContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(audioBuffer.duration * targetSampleRate),
    targetSampleRate
  );
  
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start(0);
  
  const resampledBuffer = await audioContext.startRendering();
  
  console.log(`🎵 Audio resampled successfully:`);
  console.log(`   - Original: ${audioBuffer.sampleRate}Hz, ${audioBuffer.length} samples`);
  console.log(`   - Resampled: ${resampledBuffer.sampleRate}Hz, ${resampledBuffer.length} samples`);
  
  return resampledBuffer;
}

async function mixNarrationWithBackgroundMusic(
  narrationBuffer: AudioBuffer,
  backgroundMusicBuffer: AudioBuffer,
  targetSampleRate: number
): Promise<AudioBuffer> {
  console.log('🎚️ Mixing narration with background music...');

  const narrationResampled = await resampleAudioIfNeeded(narrationBuffer, targetSampleRate);
  const backgroundResampled = await resampleAudioIfNeeded(backgroundMusicBuffer, targetSampleRate);

  const outputChannels = Math.min(
    DEFAULT_CONFIG.audioChannels,
    Math.max(narrationResampled.numberOfChannels, backgroundResampled.numberOfChannels)
  );

  const outputLength = narrationResampled.length;
  const mixedBuffer = new AudioBuffer({
    length: outputLength,
    numberOfChannels: outputChannels,
    sampleRate: targetSampleRate,
  });

  const musicGain = 0.3;
  const narrationGain = 1.0;

  for (let channel = 0; channel < outputChannels; channel++) {
    const narrationChannelIndex = Math.min(channel, narrationResampled.numberOfChannels - 1);
    const backgroundChannelIndex = Math.min(channel, backgroundResampled.numberOfChannels - 1);

    const narrationData = narrationResampled.getChannelData(narrationChannelIndex);
    const backgroundData = backgroundResampled.getChannelData(backgroundChannelIndex);
    const outputData = mixedBuffer.getChannelData(channel);

    const backgroundLength = backgroundData.length;
    for (let i = 0; i < outputLength; i++) {
      const narrationSample = narrationData[i] ?? 0;
      const backgroundSample = backgroundData[i % backgroundLength] ?? 0;
      const mixed = (narrationSample * narrationGain) + (backgroundSample * musicGain);
      outputData[i] = Math.max(-1, Math.min(1, mixed));
    }
  }

  console.log(`🎚️ Audio mixed successfully:`);
  console.log(`   - Duration: ${(outputLength / targetSampleRate).toFixed(2)}s (from narration)`);
  console.log(`   - Channels: ${outputChannels}`);
  console.log(`   - Music gain: ${musicGain}`);

  return mixedBuffer;
}
