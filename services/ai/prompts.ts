import { Story } from '../../types';

export const buildTranscriptPrompt = (storyDetails: Story): string => `Generate a dramatic story transcript meant for narration using TTS service.

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

export const constructImagePrompt = (story: Story): string => `Artistic, cinematic cover art for a story. 
Title: ${story.title}. 
Summary: ${story.summary}. 
Atmosphere: ${story.tags.join(', ')}. 
Style: High-quality digital concept art, epic lighting, professional composition.`;
