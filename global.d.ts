declare module '*.png' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PUBLIC_ASSETS_BUCKET?: string;
  readonly VITE_SUPABASE_PRIVATE_ASSETS_BUCKET?: string;
  readonly VITE_SUPABASE_IMAGE_BUCKET?: string;
  readonly VITE_SUPABASE_AUDIO_BUCKET?: string;
  readonly VITE_SUPABASE_MUSIC_BUCKET?: string;
  readonly VITE_SUPABASE_VIDEO_BUCKET?: string;
  readonly GEMINI_API_KEY?: string;
  readonly OPENROUTER_API_KEY?: string;
  readonly YOUTUBE_OAUTH_CLIENT_ID?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
