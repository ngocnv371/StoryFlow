import { Story } from '../../types';

export const buildTranscriptPrompt = (storyDetails: Story): string => `Generate a dramatic story transcript meant for narration using TTS service.

Title: ${storyDetails.title}
Summary: ${storyDetails.summary}

IMPORTANT INSTRUCTIONS:
1. Return your response in JSON format with exactly these six fields:
   - "tags": An array of 8-15 YouTube-style tags (short keywords/phrases relevant to the story - mix of genres, themes, moods, and related topics)
   - "title": An engaging, catchy title for the story (improve upon the provided title if needed)
   - "narrator": A brief description of the narrator's voice characteristics (tone, pace, emotion, accent, etc.)
   - "music": A brief description of the recommended background music (genre, mood, tempo, instruments, etc.)
   - "cover_prompt": A concise but vivid image-generation prompt for the story cover art
   - "transcript": The story narration in plain text

2. Generate tags in YouTube style: concise, searchable keywords that capture genres, themes, moods, and related topics.

3. The transcript should be pure narration text only - no stage directions, no formatting, no metadata. Can contain multiple paragraphs as needed.

Example format:
{
  "tags": ["sci-fi", "space opera", "adventure", "mystery", "epic story", "cinematic", "fantasy", "dramatic narration"],
  "title": "The Last Star Guardian",
  "narrator": "A warm, authoritative male voice with a mysterious tone and deliberate pacing",
  "music": "Ambient orchestral with ethereal strings, slow tempo, creating a sense of wonder and mystery",
  "cover_prompt": "Cinematic sci-fi cover art of a lone guardian on a shattered moon, luminous nebula sky, dramatic rim lighting, high-detail digital painting",
  "transcript": "Once upon a time in a distant galaxy...",
}`;

export const constructImagePrompt = (story: Story): string => story.cover_prompt || `Artistic, cinematic cover art for a story. 
Title: ${story.title}. 
Summary: ${story.summary}. 
Atmosphere: ${story.tags.join(', ')}. 
Style: High-quality digital concept art, epic lighting, professional composition.`;

export const buildProjectIdeasPrompt = (theme: string): string => `Generate exactly 10 concise short story ideas for a podcast.

Theme: ${theme}

Requirements:
1. Return JSON only.
2. Use this exact shape:
{
  "ideas": [
    "idea 1",
    "idea 2"
  ]
}
3. Include exactly 10 unique ideas in "ideas".
4. Each idea should be 1-2 sentences and suitable to use directly as a short story summary.
5. Do not include markdown or code fences.`;

export const buildExtendTranscriptPrompt = (tags: string[], transcript: string): string => `Write the next part of this story transcript.

Tags: ${tags.join(', ')}
Current transcript:
${transcript}

IMPORTANT INSTRUCTIONS:
1. Return plain text only (no JSON, no markdown, no code fences).
2. Continue naturally from the last sentence with consistent tone and pacing.
3. Do not repeat earlier paragraphs.
4. Keep it narration-only text.`;
