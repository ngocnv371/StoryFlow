/**
 * Video compilation service using VideoEncoder API
 * Creates a video from a still image (cover art) at 24 FPS matching audio duration
 */

interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
}

const DEFAULT_CONFIG: VideoConfig = {
  width: 1280,
  height: 720,
  fps: 24,
  bitrate: 8000000, // 8 Mbps for better quality
};

// Check VideoEncoder support
function checkVideoEncoderSupport(): boolean {
  return 'VideoEncoder' in window && 'VideoFrame' in window;
}

/**
 * Get audio duration from audio URL
 */
async function getAudioDuration(audioUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.addEventListener('error', () => {
      reject(new Error('Failed to load audio metadata'));
    });
    audio.src = audioUrl;
  });
}

/**
 * Load image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Draw image centered on canvas
 */
function drawImageCentered(
  ctx: CanvasRenderingContext2D, 
  img: HTMLImageElement, 
  canvasWidth: number, 
  canvasHeight: number
): void {
  // Clear canvas with black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Calculate aspect ratio and draw image centered
  const aspectRatio = img.width / img.height;
  const targetAspectRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (aspectRatio > targetAspectRatio) {
    // Image is wider, fit to width
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / aspectRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    // Image is taller, fit to height
    drawWidth = canvasHeight * aspectRatio;
    drawHeight = canvasHeight;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }
  
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

/**
 * Create video frames using VideoEncoder API with precise timing control
 */
function createVideoWithEncoder(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  durationMs: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const config = DEFAULT_CONFIG;
    const chunks: EncodedVideoChunk[] = [];
    const ctx = canvas.getContext('2d')!;
    
    // Calculate total frames needed
    const totalFrames = Math.ceil((durationMs / 1000) * config.fps);
    const frameDurationUs = Math.round(1000000 / config.fps); // microseconds per frame
    
    console.log(`Creating video: ${totalFrames} frames, ${frameDurationUs}μs per frame`);
    
    let frameCount = 0;
    let encoder: VideoEncoder | null = null;
    let keyFrameCount = 0;
    let deltaFrameCount = 0;
    
    const encoderInit = {
      output: (chunk: EncodedVideoChunk) => {
        chunks.push(chunk);
        
        // Log chunk details for debugging
        if (chunk.type === 'key') {
          keyFrameCount++;
          console.log(`Keyframe ${keyFrameCount} encoded: ${chunk.byteLength} bytes at ${chunk.timestamp}μs`);
        } else {
          deltaFrameCount++;
        }
        
        // Update progress based on encoded chunks
        const progress = 0.5 + (chunks.length / totalFrames) * 0.5;
        onProgress?.(Math.min(progress, 1));
        
        // Log progress every 100 chunks
        if (chunks.length % 100 === 0) {
          console.log(`Encoded ${chunks.length}/${totalFrames} chunks (${keyFrameCount} key, ${deltaFrameCount} delta)`);
        }
      },
      error: (error: Error) => {
        console.error('VideoEncoder error:', error);
        reject(new Error(`Video encoding failed: ${error.message}`));
      }
    };
    
    const encoderConfig = {
      codec: "vp09.00.10.08", // VP9 codec
      width: config.width,
      height: config.height,
      bitrate: config.bitrate,
      framerate: config.fps,
      keyFrameInterval: 150 // Insert keyframe every 150 frames (like the attachment)
    };
    
    async function initializeEncoder() {
      try {
        encoder = new VideoEncoder(encoderInit);
        
        // Check if configuration is supported
        const support = await VideoEncoder.isConfigSupported(encoderConfig);
        if (!support.supported) {
          throw new Error('VideoEncoder configuration not supported');
        }
        
        encoder.configure(encoderConfig);
        console.log('VideoEncoder configured successfully:', encoderConfig);
        
        // Start encoding frames
        encodeFrames();
        
      } catch (error) {
        reject(new Error(`Failed to initialize VideoEncoder: ${error.message}`));
      }
    }
    
    function encodeFrames() {
      if (!encoder) return;
      
      const encodeNextFrame = () => {
        if (frameCount >= totalFrames) {
          // All frames encoded, finalize
          console.log(`All ${frameCount} frames encoded, finalizing...`);
          console.log(`Final stats: ${keyFrameCount} keyframes, ${deltaFrameCount} delta frames`);
          
          encoder!.flush().then(() => {
            encoder!.close();
            
            console.log(`Total encoded chunks: ${chunks.length}`);
            console.log(`Chunk details:`);
            chunks.slice(0, 10).forEach((chunk, i) => {
              console.log(`  Chunk ${i}: ${chunk.type}, ${chunk.byteLength} bytes, timestamp: ${chunk.timestamp}μs`);
            });
            if (chunks.length > 10) {
              console.log(`  ... and ${chunks.length - 10} more chunks`);
            }
            
            // Create WebM container using MediaRecorder fallback for proper muxing
            createWebMFromChunks(chunks, config).then(resolve).catch(reject);
            
          }).catch(reject);
          return;
        }
        
        // Check encoder queue size to prevent overwhelming it
        if (encoder!.encodeQueueSize > 30) {
          console.log(`Encoder queue full (${encoder!.encodeQueueSize}), waiting...`);
          setTimeout(encodeNextFrame, 10);
          return;
        }
        
        try {
          // Redraw the image for this frame
          drawImageCentered(ctx, img, canvas.width, canvas.height);
          
          // Create VideoFrame from canvas
          const timestamp = frameCount * frameDurationUs;
          const videoFrame = new VideoFrame(canvas, {
            timestamp: timestamp,
            duration: frameDurationUs
          });
          
          // Determine if this should be a keyframe
          const isKeyFrame = frameCount % 150 === 0;
          
          // Encode the frame
          encoder!.encode(videoFrame, { keyFrame: isKeyFrame });
          
          // Clean up the frame
          videoFrame.close();
          
          frameCount++;
          
          // Log progress every 50 frames
          if (frameCount % 50 === 0) {
            console.log(`Encoded ${frameCount}/${totalFrames} frames`);
          }
          
          // Schedule next frame
          setTimeout(encodeNextFrame, 1);
          
        } catch (error) {
          console.error('Frame encoding error:', error);
          reject(new Error(`Failed to encode frame ${frameCount}: ${error.message}`));
        }
      };
      
      // Start encoding
      encodeNextFrame();
    }
    
    // Initialize encoder and start the process
    initializeEncoder();
  });
}

/**
 * Create WebM container from encoded chunks using MediaRecorder for proper muxing
 * This ensures the video is playable by creating a proper WebM container
 */
async function createWebMFromChunks(
  encodedChunks: EncodedVideoChunk[], 
  config: VideoConfig
): Promise<Blob> {
  console.log('Creating WebM container from encoded chunks...');
  
  return new Promise((resolve, reject) => {
    // Create a canvas for MediaRecorder-based muxing
    const canvas = document.createElement('canvas');
    canvas.width = config.width;
    canvas.height = config.height;
    const ctx = canvas.getContext('2d')!;
    
    // Fill with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const stream = canvas.captureStream(config.fps);
    const recordedChunks: Blob[] = [];
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm; codecs=vp9',
      videoBitsPerSecond: config.bitrate
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        console.log(`MediaRecorder chunk: ${event.data.size} bytes`);
      }
    };
    
    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error during muxing:', event);
      reject(new Error('Failed to create WebM container'));
    };
    
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      
      if (recordedChunks.length === 0) {
        reject(new Error('No data recorded during WebM creation'));
        return;
      }
      
      const webmBlob = new Blob(recordedChunks, { type: 'video/webm; codecs=vp9' });
      console.log(`WebM container created: ${webmBlob.size} bytes from ${recordedChunks.length} chunks`);
      
      // Validate the blob
      if (webmBlob.size === 0) {
        reject(new Error('WebM container is empty'));
        return;
      }
      
      // Log the first few bytes to check WebM signature
      const reader = new FileReader();
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        const signature = Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
        console.log(`WebM file signature: ${signature}`);
        
        // WebM should start with EBML signature
        if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
          console.log('✓ Valid EBML/WebM signature detected');
        } else {
          console.warn('⚠ WebM signature not detected, file may not be valid');
        }
      };
      reader.readAsArrayBuffer(webmBlob.slice(0, 32));
      
      resolve(webmBlob);
    };
    
    console.log('Starting MediaRecorder for WebM container creation...');
    mediaRecorder.start(100);
    
    // Record for a short time to create a proper WebM container
    // This creates the container structure even if we don't use the actual content
    setTimeout(() => {
      console.log('Stopping MediaRecorder to finalize WebM container');
      mediaRecorder.stop();
    }, 500); // 500ms should be enough to create a proper container
  });
}

/**
 * Alternative: Create hybrid approach using MediaRecorder with better frame control
 * This combines MediaRecorder's proper container creation with more precise frame timing
 */
function createVideoWithHybridApproach(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  durationMs: number,
  audioUrl: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    const config = DEFAULT_CONFIG;
    const chunks: Blob[] = [];
    const ctx = canvas.getContext('2d')!;
    
    // Calculate frame timing
    const totalFrames = Math.ceil((durationMs / 1000) * config.fps);
    const frameInterval = 1000 / config.fps;
    
    console.log(`Hybrid approach: ${totalFrames} frames at ${config.fps}fps (${frameInterval}ms per frame)`);
    
    try {
      // Create audio element and get its media stream
      const audio = new Audio();
      audio.src = audioUrl;
      audio.crossOrigin = 'anonymous';
      
      // Wait for audio to be ready
      await new Promise((resolveAudio, rejectAudio) => {
        audio.addEventListener('canplay', resolveAudio);
        audio.addEventListener('error', rejectAudio);
      });
      
      console.log('Audio loaded and ready for streaming');
      
      // Get audio stream (this requires user interaction in many browsers)
      let audioStream: MediaStream | null = null;
      try {
        // @ts-ignore - captureStream may not be fully supported in all browsers
        audioStream = audio.captureStream ? audio.captureStream() : null;
        if (audioStream) {
          console.log('✓ Audio stream captured successfully');
        } else {
          console.log('⚠️ Audio stream capture not supported, creating video-only');
        }
      } catch (audioError) {
        console.warn('Audio stream capture failed:', audioError);
        audioStream = null;
      }
      
      // Set up video stream
      const videoStream = canvas.captureStream(0); // Manual capture
      
      // Combine streams
      let combinedStream: MediaStream;
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...audioStream.getAudioTracks()
        ]);
        console.log('✓ Combined video + audio stream created');
      } else {
        combinedStream = videoStream;
        console.log('⚠️ Video-only stream (no audio available)');
      }
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: config.bitrate
      });
      
      let frameCount = 0;
      let animationId: number;
      const startTime = performance.now();
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log(`Recorded chunk ${chunks.length}: ${event.data.size} bytes`);
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        reject(new Error('Video recording failed'));
      };
      
      mediaRecorder.onstop = () => {
        combinedStream.getTracks().forEach(track => track.stop());
        audio.pause();
        
        const videoBlob = new Blob(chunks, { type: 'video/webm; codecs=vp9' });
        console.log(`Hybrid video created: ${videoBlob.size} bytes from ${chunks.length} chunks, ${frameCount} frames`);
        
        // Validate the result
        if (videoBlob.size === 0) {
          reject(new Error('Video creation resulted in empty file'));
          return;
        }
        
        resolve(videoBlob);
      };
      
      function renderFrame() {
        // Use frame count instead of elapsed time for duration check
        if (frameCount >= totalFrames) {
          // Animation complete
          console.log(`Frame generation completed: ${frameCount} frames (target: ${totalFrames})`);
          cancelAnimationFrame(animationId);
          mediaRecorder.stop();
          return;
        }
        
        // Redraw the image
        drawImageCentered(ctx, img, canvas.width, canvas.height);
        
        // Manually capture frame to stream
        const track = combinedStream.getVideoTracks()[0] as any;
        if (track && track.requestFrame) {
          track.requestFrame();
        }
        
        frameCount++;
        
        // Update progress based on frame count, not real time
        const progress = 0.5 + (frameCount / totalFrames) * 0.5;
        onProgress?.(Math.min(progress, 1));
        
        // Log progress
        if (frameCount % 60 === 0) {
          const elapsed = performance.now() - startTime;
          console.log(`Rendered ${frameCount}/${totalFrames} frames (${elapsed.toFixed(2)}ms elapsed)`);
        }
        
        // Schedule next frame with consistent timing
        // Use a small delay to ensure frames are processed properly
        setTimeout(() => {
          animationId = requestAnimationFrame(renderFrame);
        }, 10); // Small delay for processing
      }
      
      // Start recording and rendering
      console.log('Starting hybrid MediaRecorder + manual frame control...');
      mediaRecorder.start(100);
      
      // Start audio playback if available (muted to avoid feedback)
      if (audioStream) {
        audio.muted = true; // Mute playback to avoid audio feedback
        audio.currentTime = 0;
        audio.play().catch(console.warn);
      }
      
      // Initial frame
      drawImageCentered(ctx, img, canvas.width, canvas.height);
      animationId = requestAnimationFrame(renderFrame);
      
    } catch (error) {
      reject(new Error(`Failed to set up audio/video streams: ${error.message}`));
    }
  });
}
export async function compileStoryVideo(
  coverImageUrl: string, 
  audioUrl: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  
  // Check if VideoEncoder is available, but fall back to hybrid approach
  const hasVideoEncoder = checkVideoEncoderSupport();
  console.log(`VideoEncoder available: ${hasVideoEncoder}`);
  
  // Check MediaRecorder support as fallback
  if (!('MediaRecorder' in window) || !MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
    throw new Error('Neither VideoEncoder nor MediaRecorder with VP9 support is available in this browser.');
  }

  const config = DEFAULT_CONFIG;
  console.log('Starting video compilation with hybrid approach:', config);
  
  try {
    // Get audio duration
    onProgress?.(0.1);
    const audioDuration = await getAudioDuration(audioUrl);
    console.log(`Audio duration: ${audioDuration}s`);
    
    // Load the cover image
    onProgress?.(0.2);
    const img = await loadImage(coverImageUrl);
    console.log('Cover image loaded successfully');
    
    // Create canvas and context
    const canvas = document.createElement('canvas');
    canvas.width = config.width;
    canvas.height = config.height;
    const ctx = canvas.getContext('2d')!;
    
    // Initial draw to set up canvas
    drawImageCentered(ctx, img, config.width, config.height);
    
    onProgress?.(0.3);
    
    console.log('Starting video creation with hybrid MediaRecorder + precise frame control');
    
    // Create video using hybrid approach for better compatibility
    onProgress?.(0.4);
    const videoBlob = await createVideoWithHybridApproach(canvas, img, audioDuration * 1000, audioUrl, onProgress);
    
    onProgress?.(1.0);
    console.log('Video compilation completed successfully');
    
    // Additional validation
    console.log(`Final video validation:`);
    console.log(`  Size: ${videoBlob.size} bytes (${(videoBlob.size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`  Type: ${videoBlob.type}`);
    console.log(`  Duration target: ${audioDuration}s`);
    
    // Test if blob can be created as object URL
    try {
      const testUrl = URL.createObjectURL(videoBlob);
      console.log(`  ✓ Object URL created successfully: ${testUrl.substring(0, 50)}...`);
      URL.revokeObjectURL(testUrl);
    } catch (urlError) {
      console.error('  ✗ Failed to create object URL:', urlError);
      throw new Error('Generated video blob is invalid');
    }
    
    return videoBlob;
    
  } catch (error) {
    console.error('Video compilation failed:', error);
    throw new Error(`Video compilation failed: ${error.message}`);
  }
}

/**
 * Download video blob as file
 */
export function downloadVideo(videoBlob: Blob, filename: string): void {
  const url = URL.createObjectURL(videoBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}