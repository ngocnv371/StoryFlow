import { GoogleGenAI, Modality } from '@google/genai';
import { AppConfig, Story } from '../../../types';
import { createWavHeader } from '../../audio';
import { buildTranscriptPrompt, constructImagePrompt } from '../prompts';
import { uploadBase64ToSupabase, uploadToSupabase } from '../storage';
import { AIGenerationFactory, GeneratedStoryText } from '../types';

export class GeminiAIGenerationFactory implements AIGenerationFactory {
  async generateText(config: AppConfig, storyDetails: Story): Promise<GeneratedStoryText> {
    const apiKey = config.gemini.apiKey || process.env.API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: config.gemini.textModel || 'gemini-3-flash-preview',
        contents: buildTranscriptPrompt(storyDetails),
      });

      if (!response.text) {
        console.warn('Gemini returned an empty response for transcript:', response);
        throw new Error('Empty response from AI model');
      }

      const text = response.text.trim();
      const cleanedText = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

      try {
        const parsed = JSON.parse(cleanedText);
        return {
          title: parsed.title || storyDetails.title,
          transcript: parsed.transcript || 'Failed to generate transcript.',
          narrator: parsed.narrator || 'Neutral narrator voice',
          music: parsed.music || 'Ambient background music',
          tags: Array.isArray(parsed.tags) ? parsed.tags : []
        };
      } catch {
        console.error('Failed to parse JSON response:', cleanedText);
        return {
          title: storyDetails.title,
          transcript: cleanedText,
          narrator: 'Neutral narrator voice',
          music: 'Ambient background music',
          tags: []
        };
      }
    } catch (error: any) {
      console.error('Transcript generation error details:', error);
      throw new Error(error.message || 'Transcript generation failed.');
    }
  }

  async generateImage(config: AppConfig, story: Story): Promise<string> {
    const finalApiKey = config.gemini.apiKey || process.env.API_KEY || '';
    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    const requestedAspectRatio = config.imageGen.width && config.imageGen.height
      ? `${config.imageGen.width}:${config.imageGen.height}`
      : '16:9';

    try {
      const response = await ai.models.generateContent({
        model: config.gemini.imageModel || 'gemini-2.5-flash-image',
        contents: { parts: [{ text: constructImagePrompt(story) }] },
        config: { imageConfig: { aspectRatio: requestedAspectRatio } }
      });

      let base64 = '';
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) base64 = part.inlineData.data;
        }
      }

      if (!base64) {
        console.error('Image generation failed. Full response:', response);
        throw new Error('No image data returned from model. It might be blocked by safety filters.');
      }

      return await uploadBase64ToSupabase('thumbnails', `${story.id}.png`, base64, 'image/png');
    } catch (error: any) {
      console.error('Cover image generation error details:', error);
      throw new Error(error.message || 'Image generation failed.');
    }
  }

  async generateAudio(config: AppConfig, story: Story): Promise<string> {
    const finalApiKey = config.gemini.apiKey || process.env.API_KEY || '';
    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    const speed = config.audioGen.speed ?? 1;
    const voice = config.audioGen.voice || 'Kore';

    try {
      const response = await ai.models.generateContent({
        model: config.gemini.audioModel || 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: `Say naturally and cinematically at ${speed}x speed: ${story.transcript.substring(0, 1500)}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        console.error('Audio generation failed. Full response:', response);
        throw new Error('No audio data returned. The model might have failed to process the text.');
      }

      const binaryString = atob(base64Audio);
      const pcmData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pcmData[i] = binaryString.charCodeAt(i);
      }

      const wavData = createWavHeader(pcmData, 24000);
      return await uploadToSupabase('audio', `${story.id}.wav`, wavData, 'audio/wav');
    } catch (error: any) {
      console.error('Audio generation error details:', error);
      throw new Error(error.message || 'Audio generation failed.');
    }
  }
}
