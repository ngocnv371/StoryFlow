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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
