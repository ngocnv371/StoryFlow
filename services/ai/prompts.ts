import { Story } from '../../types';

export const buildTranscriptPrompt = (storyDetails: Story): string => {
  const isShortForm = storyDetails.metadata?.transcript_form === 'short';

  return `Generate a dramatic story transcript meant for narration using TTS service.

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

3. ${isShortForm
  ? 'The transcript should fit for YouTube short and narration-only in multiple paragraphs. Keep it focused and compact (no stage directions, no formatting, no metadata).'
  : 'The transcript should be at least 3000 words in multiple paragraphs of pure narration text only - no stage directions, no formatting, no metadata.'}

Example format:
{
  "tags": ["sci-fi", "space opera", "adventure", "mystery", "epic story", "cinematic", "fantasy", "dramatic narration"],
  "title": "The Last Star Guardian",
  "narrator": "A warm, authoritative male voice with a mysterious tone and deliberate pacing",
  "music": "Ambient orchestral with ethereal strings, slow tempo, creating a sense of wonder and mystery",
  "cover_prompt": "Cinematic sci-fi cover art of a lone guardian on a shattered moon, luminous nebula sky, dramatic rim lighting, high-detail digital painting",
  "transcript": "Once upon a time in a distant galaxy...",
}`;
};

export const constructImagePrompt = (story: Story): string => story.cover_prompt || `Artistic, cinematic cover art for a story. 
Title: ${story.title}. 
Summary: ${story.summary}. 
Atmosphere: ${story.tags.join(', ')}. 
Style: High-quality digital concept art, epic lighting, professional composition.`;

export const buildImagePromptsRequest = (story: Story): string => {
  const basePrompt = story.cover_prompt || `Artistic, cinematic cover art for a story titled "${story.title}" with summary: ${story.summary}`;

  const script = (story.transcript || story.metadata?.transcript || story.summary || '').trim();

  return `Help me write a series of image prompts appropriate for a YouTube Short script.

Cut the provided script into a natural sequence of visual sections. Each section must have a corresponding image prompt that stays tightly aligned to the specific action, subject, mood, and setting of that section.

Return JSON only in this exact format:
{
  "sections": [
    {
      "text": "",
      "prompt": ""
    }
  ]
}

Title: ${story.title}

Summary: ${story.summary}
Tags: ${story.tags.join(', ')}
Base Visual Style: ${basePrompt}

Here is the script:
${script}

IMPORTANT INSTRUCTIONS:
1. Decide the number of sections based on the actual visual beats of the script. Do not force a fixed count.
2. Each "text" value must contain the script excerpt for that section, kept concise but faithful to the source.
3. Each "prompt" value must describe only the image for its matching section, not a generic full-story visual.
4. Keep each prompt cinematic, visually specific, and suitable for AI image generation.
5. Preserve consistent character appearance, setting continuity, and overall visual tone across sections.
6. Avoid adding details that are not supported by the script.
7. Do not include markdown or code fences.`;
};

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
