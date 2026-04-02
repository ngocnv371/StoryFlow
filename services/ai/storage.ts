import { supabase } from '../../supabaseClient';

const resolveBucket = (value: string | undefined, fallback: string): string => {
  const resolved = value?.trim();
  return resolved && resolved.length > 0 ? resolved : fallback;
};

export const SUPABASE_PUBLIC_ASSETS_BUCKET = resolveBucket(import.meta.env.VITE_SUPABASE_PUBLIC_ASSETS_BUCKET, 'public-assets');
export const SUPABASE_PRIVATE_ASSETS_BUCKET = resolveBucket(import.meta.env.VITE_SUPABASE_PRIVATE_ASSETS_BUCKET, 'private-assets');
export const SUPABASE_IMAGE_BUCKET = resolveBucket(import.meta.env.VITE_SUPABASE_IMAGE_BUCKET, SUPABASE_PUBLIC_ASSETS_BUCKET);
export const SUPABASE_AUDIO_BUCKET = resolveBucket(import.meta.env.VITE_SUPABASE_AUDIO_BUCKET, SUPABASE_PUBLIC_ASSETS_BUCKET);
export const SUPABASE_MUSIC_BUCKET = resolveBucket(import.meta.env.VITE_SUPABASE_MUSIC_BUCKET, SUPABASE_PUBLIC_ASSETS_BUCKET);
export const SUPABASE_VIDEO_BUCKET = resolveBucket(import.meta.env.VITE_SUPABASE_VIDEO_BUCKET, SUPABASE_PUBLIC_ASSETS_BUCKET);

const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
};

export const uploadToSupabase = async (bucket: string, fileName: string, data: Blob | Uint8Array, mimeType: string) => {
  const userId = await getUserId();
  const fileBody = data instanceof Uint8Array ? new Blob([Uint8Array.from(data)], { type: mimeType }) : data;

  const { data: uploadData, error } = await supabase.storage
    .from(bucket)
    .upload(`${userId}/${Date.now()}_${fileName}`, fileBody, { contentType: mimeType, upsert: true });

  if (error) {
    console.error(`Supabase upload error [${bucket}]:`, error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
  return publicUrl;
};

export const uploadBase64ToSupabase = async (bucket: string, fileName: string, base64Data: string, mimeType: string) => {
  const byteCharacters = atob(base64Data.split(',')[1] || base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return await uploadToSupabase(bucket, fileName, byteArray, mimeType);
};

export const uploadVideoToSupabase = async (storyId: string, videoBlob: Blob): Promise<string> => {
  try {
    return await uploadToSupabase(SUPABASE_VIDEO_BUCKET, `${storyId}.webm`, videoBlob, 'video/webm');
  } catch (error: any) {
    console.error('Video upload error details:', error);
    throw new Error(error.message || 'Video upload failed.');
  }
};
