
import { GoogleGenAI, Modality } from "@google/genai";
import { TextGenConfig, Story } from "../types";
import { supabase } from "../supabaseClient";
import { createWavHeader } from "./audio";

/**
 * Uploads audio data to Supabase Storage
 */
const uploadToSupabase = async (bucket: string, fileName: string, data: Blob | Uint8Array, mimeType: string) => {
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

/**
 * Uploads a base64 string to Supabase Storage (for images)
 */
const uploadBase64ToSupabase = async (bucket: string, fileName: string, base64Data: string, mimeType: string) => {
  const byteCharacters = atob(base64Data.split(',')[1] || base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return await uploadToSupabase(bucket, fileName, byteArray, mimeType);
};

export const generateStoryTranscript = async (
  config: TextGenConfig,
  storyDetails: Story
): Promise<Pick<Story, "title" | "transcript" | "narrator" | "music" | "tags">> => {
  const apiKey = config.apiKey || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Generate a dramatic story transcript meant for narration using TTS service.

Title: ${storyDetails.title}
Summary: ${storyDetails.summary}

IMPORTANT INSTRUCTIONS:
1. Return your response in JSON format with exactly these five fields:
   - "title": An engaging, catchy title for the story (improve upon the provided title if needed)
   - "transcript": The story narration in plain text
   - "narrator": A brief description of the narrator's voice characteristics (tone, pace, emotion, accent, etc.)
   - "music": A brief description of the recommended background music (genre, mood, tempo, instruments, etc.)
   - "tags": An array of 8-15 YouTube-style tags (short keywords/phrases relevant to the story - mix of genres, themes, moods, and related topics)

2. The transcript should be pure narration text only - no stage directions, no formatting, no metadata. Can contain multiple paragraphs as needed.

3. Generate tags in YouTube style: concise, searchable keywords that capture genres, themes, moods, and related topics.

Example format:
{
  "title": "The Last Star Guardian",
  "transcript": "Once upon a time in a distant galaxy...",
  "narrator": "A warm, authoritative male voice with a mysterious tone and deliberate pacing",
  "music": "Ambient orchestral with ethereal strings, slow tempo, creating a sense of wonder and mystery",
  "tags": ["sci-fi", "space opera", "adventure", "mystery", "epic story", "cinematic", "fantasy", "dramatic narration"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: config.model || 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    if (!response.text) {
      console.warn("Gemini returned an empty response for transcript:", response);
      throw new Error("Empty response from AI model");
    }
    
    // Parse JSON response
    const text = response.text.trim();
    // Remove markdown code blocks if present
    const cleanedText = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    
    try {
      const parsed = JSON.parse(cleanedText);
      return {
        title: parsed.title || storyDetails.title,
        transcript: parsed.transcript || "Failed to generate transcript.",
        narrator: parsed.narrator || "Neutral narrator voice",
        music: parsed.music || "Ambient background music",
        tags: Array.isArray(parsed.tags) ? parsed.tags : []
      };
    } catch (parseError) {
      console.error("Failed to parse JSON response:", cleanedText);
      // Fallback: use the raw text as transcript
      return {
        title: storyDetails.title,
        transcript: cleanedText,
        narrator: "Neutral narrator voice",
        music: "Ambient background music",
        tags: []
      };
    }
  } catch (error: any) {
    console.error("Transcript generation error details:", error);
    throw new Error(error.message || "Transcript generation failed.");
  }
};

export const constructImagePrompt = (story: Story): string => {
  const prompt = `Artistic, cinematic cover art for a story. 
Title: ${story.title}. 
Summary: ${story.summary}. 
Atmosphere: ${story.tags.join(', ')}. 
Style: High-quality digital concept art, epic lighting, professional composition.`;
  return prompt;
}

export const generateCoverImage = async (apiKey: string, story: Story): Promise<string> => {
  const finalApiKey = apiKey || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey: finalApiKey });
  const prompt = constructImagePrompt(story);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    let base64 = "";
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) base64 = part.inlineData.data;
      }
    }

    if (!base64) {
      console.error("Image generation failed. Full response:", response);
      throw new Error("No image data returned from model. It might be blocked by safety filters.");
    }

    return await uploadBase64ToSupabase('thumbnails', `${story.id}.png`, base64, 'image/png');
  } catch (error: any) {
    console.error("Cover image generation error details:", error);
    throw new Error(error.message || "Image generation failed.");
  }
};

export const generateAudioSpeech = async (apiKey: string, story: Story): Promise<string> => {
  const finalApiKey = apiKey || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say naturally and cinematically: ${story.transcript.substring(0, 1500)}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      console.error("Audio generation failed. Full response:", response);
      throw new Error("No audio data returned. The model might have failed to process the text.");
    }

    // Decode base64 to raw bytes
    const binaryString = atob(base64Audio);
    const pcmData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      pcmData[i] = binaryString.charCodeAt(i);
    }

    // Wrap raw PCM in a WAV header
    const wavData = createWavHeader(pcmData, 24000);

    // Upload the valid WAV file to Supabase
    return await uploadToSupabase('audio', `${story.id}.wav`, wavData, 'audio/wav');
  } catch (error: any) {
    console.error("Audio generation error details:", error);
    throw new Error(error.message || "Audio generation failed.");
  }
};
