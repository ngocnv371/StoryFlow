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

const DEFAULT_CONFIG: VideoConfig = {
  width: 1280,
  height: 720,
  fps: 24,
  bitrate: 8000000,
  audioBitrate: 128000,
  audioSampleRate: 48000,
  audioChannels: 2,
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
 */
export async function compileStoryVideo(
  coverImageUrl: string, 
  audioUrl: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  
  console.log('🚀 Starting video compilation...');
  console.log(`📄 Cover image URL: ${coverImageUrl}`);
  console.log(`🎵 Audio URL: ${audioUrl}`);

  try {
    // Load the cover image and audio in parallel
    const [coverImage, audioBuffer] = await Promise.all([
      loadImage(coverImageUrl),
      loadAndDecodeAudio(audioUrl)
    ]);

    const duration = audioBuffer.duration;
    const totalFrames = Math.ceil(duration * DEFAULT_CONFIG.fps);
    
    console.log(`🎬 Video will be ${duration.toFixed(2)}s long (${totalFrames} frames at ${DEFAULT_CONFIG.fps}fps)`);

    // Create canvas for rendering
    const canvas = new OffscreenCanvas(DEFAULT_CONFIG.width, DEFAULT_CONFIG.height);
    const ctx = canvas.getContext('2d', { alpha: false })!;

    // Draw the cover image to fill the canvas
    drawCoverImageToCanvas(ctx, coverImage, DEFAULT_CONFIG.width, DEFAULT_CONFIG.height);

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
    output.addVideoTrack(canvasSource, { frameRate: DEFAULT_CONFIG.fps });

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
    
    // Render all frames (static image)
    for (let currentFrame = 0; currentFrame < totalFrames; currentFrame++) {
      const currentTime = currentFrame / DEFAULT_CONFIG.fps;
      
      // Add frame to video (canvas content is already drawn and static)
      await canvasSource.add(currentTime, 1 / DEFAULT_CONFIG.fps);
      
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
      const resampledAudio = await resampleAudioIfNeeded(audioBuffer, DEFAULT_CONFIG.audioSampleRate);
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
function drawCoverImageToCanvas(
  ctx: OffscreenCanvasRenderingContext2D, 
  img: HTMLImageElement, 
  canvasWidth: number, 
  canvasHeight: number
) {
  console.log('🖼️ Drawing cover image to canvas...');
  
  // Clear canvas with black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
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
  
  // Draw the image
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  
  console.log(`🖼️ Image drawn to canvas:`);
  console.log(`   - Canvas: ${canvasWidth}x${canvasHeight}px`);
  console.log(`   - Image: ${img.width}x${img.height}px`);
  console.log(`   - Drawn: ${drawWidth.toFixed(0)}x${drawHeight.toFixed(0)}px at (${drawX.toFixed(0)}, ${drawY.toFixed(0)})`);
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
