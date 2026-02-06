
import { GoogleGenAI, Modality } from "@google/genai";
import { TextGenConfig, Story } from "../types";
import { supabase } from "../supabaseClient";

/**
 * Uploads a base64 string to Supabase Storage
 */
const uploadToSupabase = async (bucket: string, fileName: string, base64Data: string, mimeType: string) => {
  // Convert base64 to Blob
  const byteCharacters = atob(base64Data.split(',')[1] || base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(`${Date.now()}_${fileName}`, blob, { contentType: mimeType, upsert: true });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
};

export const generateStoryTranscript = async (
  config: TextGenConfig,
  storyDetails: { title: string; summary: string; tags: string[] }
): Promise<string> => {
  const apiKey = config.apiKey || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Generate a detailed cinematic story transcript for: ${storyDetails.title}. Summary: ${storyDetails.summary}. Tags: ${storyDetails.tags.join(', ')}`;

  try {
    const response = await ai.models.generateContent({
      model: config.model || 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Failed to generate transcript.";
  } catch (error: any) {
    throw new Error(error.message || "Transcript generation failed.");
  }
};

export const generateCoverImage = async (apiKey: string, story: Story): Promise<string> => {
  const finalApiKey = apiKey || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey: finalApiKey });
  const prompt = `Cinematic digital art cover for: ${story.title}. Themes: ${story.tags.join(', ')}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    let base64 = "";
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) base64 = part.inlineData.data;
    }

    if (!base64) throw new Error("No image data returned.");

    // Upload to Supabase
    return await uploadToSupabase('thumbnails', `${story.id}.png`, base64, 'image/png');
  } catch (error: any) {
    throw new Error(error.message || "Image generation failed.");
  }
};

export const generateAudioSpeech = async (apiKey: string, story: Story): Promise<string> => {
  const finalApiKey = apiKey || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say naturally and cinematically: ${story.transcript.substring(0, 1000)}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned.");

    // Upload PCM to Supabase
    // Note: To be perfectly playable in browser, usually we'd wrap in WAV, 
    // but many modern players handle raw data if the mime is set correctly.
    // For safety, we upload as pcm or webm depending on what the player expects.
    return await uploadToSupabase('audio', `${story.id}.wav`, base64Audio, 'audio/wav');
  } catch (error: any) {
    throw new Error(error.message || "Audio generation failed.");
  }
};
