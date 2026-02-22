
export interface Story {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  tags: string[];
  transcript: string;
  narrator?: string;
  music?: string;
  status: 'Draft' | 'Pending' | 'Completed';
  created_at: string;
  thumbnail_url: string;
  audio_url?: string;
}

export type TextGenProvider = 'gemini' | 'openai';
export type AudioGenProvider = 'gemini' | 'elevenlabs' | 'whisper';
export type ImageGenProvider = 'gemini' | 'comfyui';

// VideoEncoder API types (for browsers that support it)
declare global {
  interface VideoEncoder {
    new(init: VideoEncoderInit): VideoEncoder;
    configure(config: VideoEncoderConfig): void;
    encode(frame: VideoFrame, options?: VideoEncoderEncodeOptions): void;
    flush(): Promise<void>;
    close(): void;
    readonly encodeQueueSize: number;
    readonly state: CodecState;
    static isConfigSupported(config: VideoEncoderConfig): Promise<VideoEncoderSupport>;
  }

  interface VideoEncoderInit {
    output: (chunk: EncodedVideoChunk) => void;
    error: (error: Error) => void;
  }

  interface VideoEncoderConfig {
    codec: string;
    width: number;
    height: number;
    bitrate?: number;
    framerate?: number;
    keyFrameInterval?: number;
  }

  interface VideoEncoderEncodeOptions {
    keyFrame?: boolean;
  }

  interface VideoEncoderSupport {
    supported: boolean;
    config?: VideoEncoderConfig;
  }

  interface VideoFrame {
    new(source: CanvasImageSource, init?: VideoFrameInit): VideoFrame;
    readonly timestamp: number;
    readonly duration?: number;
    close(): void;
  }

  interface VideoFrameInit {
    timestamp: number;
    duration?: number;
  }

  interface EncodedVideoChunk {
    readonly type: 'key' | 'delta';
    readonly timestamp: number;
    readonly duration?: number;
    readonly byteLength: number;
    copyTo(destination: ArrayBufferView): void;
  }

  interface EncodedVideoChunk {
    readonly type: 'key' | 'delta';
    readonly timestamp: number;
    readonly duration?: number;
    readonly byteLength: number;
    copyTo(destination: ArrayBufferView): void;
  }

  type CodecState = 'unconfigured' | 'configured' | 'closed';

  const VideoEncoder: {
    prototype: VideoEncoder;
    new(init: VideoEncoderInit): VideoEncoder;
    isConfigSupported(config: VideoEncoderConfig): Promise<VideoEncoderSupport>;
  };

  const VideoFrame: {
    prototype: VideoFrame;
    new(source: CanvasImageSource, init?: VideoFrameInit): VideoFrame;
  };
}

export interface TextGenConfig {
  provider: TextGenProvider;
  apiKey: string;
  model: string;
  endpoint?: string;
}

export interface AudioGenConfig {
  provider: AudioGenProvider;
  apiKey: string;
  model?: string;
  endpoint?: string;
}

export interface ImageGenConfig {
  provider: ImageGenProvider;
  apiKey: string;
  endpoint?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AppConfig {
  textGen: TextGenConfig;
  audioGen: AudioGenConfig;
  imageGen: ImageGenConfig;
}
