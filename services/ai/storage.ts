import { supabase } from '../../supabaseClient';

export const uploadToSupabase = async (bucket: string, fileName: string, data: Blob | Uint8Array, mimeType: string) => {
  const fileBody = data instanceof Uint8Array ? new Blob([data], { type: mimeType }) : data;

  const { data: uploadData, error } = await supabase.storage
    .from(bucket)
    .upload(`${Date.now()}_${fileName}`, fileBody, { contentType: mimeType, upsert: true });

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
    return await uploadToSupabase('video', `${storyId}.webm`, videoBlob, 'video/webm');
  } catch (error: any) {
    console.error('Video upload error details:', error);
    throw new Error(error.message || 'Video upload failed.');
  }
};
