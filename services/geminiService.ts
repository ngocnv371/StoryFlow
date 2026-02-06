
import { GoogleGenAI } from "@google/genai";
import { TextGenConfig, Story } from "../types";

export const generateStoryTranscript = async (
  config: TextGenConfig,
  storyDetails: { title: string; summary: string; tags: string[] }
): Promise<string> => {
  const apiKey = config.apiKey || process.env.API_KEY || '';
  
  if (!apiKey && config.provider === 'gemini') {
    throw new Error("Missing API Key for Gemini. Please configure it in settings.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = config.model || 'gemini-3-flash-preview';

  const prompt = `
    Generate a detailed story transcript based on the following information:
    Title: ${storyDetails.title}
    Summary: ${storyDetails.summary}
    Tags: ${storyDetails.tags.join(', ')}

    Please write a cinematic and engaging script or narrative transcript for this story.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      },
    });

    return response.text || "Failed to generate transcript.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "An error occurred during transcript generation.");
  }
};

export const generateCoverImage = async (
  apiKey: string,
  story: Story
): Promise<string> => {
  const finalApiKey = apiKey || process.env.API_KEY || '';
  if (!finalApiKey) {
    throw new Error("Missing API Key for Image Generation.");
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });
  const prompt = `Artistic, cinematic cover art for a story. 
Title: ${story.title}. 
Summary: ${story.summary}. 
Atmosphere: ${story.tags.join(', ')}. 
Context: ${story.transcript.substring(0, 300)}...
Style: High-quality digital concept art, epic lighting, professional composition.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model.");
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};
