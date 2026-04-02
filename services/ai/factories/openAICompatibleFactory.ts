import { AppConfig, Story } from "../../../types";
import {
  buildExtendTranscriptPrompt,
  buildProjectIdeasPrompt,
  buildTranscriptPrompt,
} from "../prompts";
import {
  AIGenerationFactory,
  GeneratedAudio,
  GeneratedStoryText,
} from "../types";

type OpenAICompatibleResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const DEFAULT_TEXT_MODEL = "gpt-4o-mini";

function parseJsonResponse(rawText: string): string {
  var trimmed = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // sometimes it missed a closing bracket '}' so if it doesn't end with '}' we add it and try to parse, if it fails we fallback to raw text
  if (!trimmed.endsWith("}")) {
    trimmed += "}";
  }
  return trimmed;
}

function resolveChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.endsWith("/chat/completions")) {
    return trimmed;
  }

  const withoutTrailingSlash = trimmed.replace(/\/$/, "");
  if (withoutTrailingSlash.endsWith("/v1")) {
    return `${withoutTrailingSlash}/chat/completions`;
  }

  return `${withoutTrailingSlash}/v1/chat/completions`;
}

export class OpenAICompatibleAIGenerationFactory implements AIGenerationFactory {
  private async chat(config: AppConfig, prompt: string): Promise<string> {
    const endpoint = resolveChatCompletionsUrl(config.openAICompatible.url);
    if (!endpoint) {
      throw new Error("OpenAI compatible URL is required for text generation.");
    }

    const token = config.openAICompatible.token?.trim();
    if (!token) {
      throw new Error(
        "OpenAI compatible token is required for text generation.",
      );
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: DEFAULT_TEXT_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      let details = "";
      try {
        const body = await response.text();
        details = body ? ` - ${body}` : "";
      } catch {}
      throw new Error(
        `OpenAI compatible request failed (${response.status})${details}`,
      );
    }

    const data: OpenAICompatibleResponse = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("OpenAI compatible provider returned an empty response.");
    }

    return text;
  }

  async generateText(
    config: AppConfig,
    storyDetails: Story,
  ): Promise<GeneratedStoryText> {
    const text = await this.chat(config, buildTranscriptPrompt(storyDetails));
    var cleanedText = parseJsonResponse(text);

    try {
      // using LM Studio sometimes returns unescaped new lines in the JSON response which breaks JSON parsing, this is a naive attempt to fix that by replacing unescaped new lines with escaped ones, it may not cover all edge cases but should work for most simple transcripts
      // cut the section from "transcript": to the end of the transcript
      // then parse the remaining since they're usually well formatted
      // the place the transcript back in the parsed object, this is a bit hacky but it seems LM Studio is the only one that has this issue and it only affects the transcript field
      const transcriptIndex = text.indexOf('"transcript":');
      // text without the transcript section, we add a closing bracket to make it valid JSON
      var goodStuff = text.substring(0, transcriptIndex).trim();
      if (goodStuff.endsWith(",")) {
        goodStuff = goodStuff.slice(0, -1);
      }
      goodStuff += "}";

      const rawTranscript = text.substring(
        transcriptIndex + '"transcript":'.length,
      );
      console.log("Raw transcript from AI response:", goodStuff, rawTranscript);
      const parsed = JSON.parse(goodStuff);
      var rawTranscriptTrimmed = rawTranscript.trim();
      // remove the wrapping quotes if they exist, this is a naive approach and may not cover all edge cases, but it should work for most simple transcripts
      if (rawTranscriptTrimmed.startsWith('"')) {
        rawTranscriptTrimmed = rawTranscriptTrimmed.substring(1);
      }
      if (rawTranscriptTrimmed.endsWith('"')) {
        rawTranscriptTrimmed = rawTranscriptTrimmed.substring(
          0,
          rawTranscriptTrimmed.length - 1,
        );
      }
      return {
        title: parsed.title || storyDetails.title,
        transcript: rawTranscriptTrimmed || "Failed to generate transcript.",
        narrator: parsed.narrator || "Neutral narrator voice",
        music: parsed.music || "Ambient background music",
        cover_prompt: parsed.cover_prompt || undefined,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      };
    } catch (error) {
      console.error("Failed to parse JSON response:", cleanedText, error);
      return {
        title: storyDetails.title,
        transcript: cleanedText,
        narrator: "Neutral narrator voice",
        music: "Ambient background music",
        cover_prompt: undefined,
        tags: [],
      };
    }
  }

  async extendTranscript(
    config: AppConfig,
    tags: string[],
    transcript: string,
  ): Promise<string> {
    const text = await this.chat(
      config,
      buildExtendTranscriptPrompt(tags, transcript),
    );
    return text
      .trim()
      .replace(/^```(?:text|markdown)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  async generateProjectIdeas(
    config: AppConfig,
    theme: string,
  ): Promise<string[]> {
    const text = await this.chat(config, buildProjectIdeasPrompt(theme));
    const cleanedText = parseJsonResponse(text);

    const parsed = JSON.parse(cleanedText);
    if (!Array.isArray(parsed?.ideas)) {
      throw new Error("AI response does not include an ideas array.");
    }

    const ideas = parsed.ideas
      .map((idea: unknown) => (typeof idea === "string" ? idea.trim() : ""))
      .filter((idea: string) => idea.length > 0)
      .slice(0, 10);

    return ideas;
  }

  async generateImagePrompts(_config: AppConfig, _story: Story, _numberOfPrompts: number): Promise<string[]> {
    throw new Error(
      "OpenAI compatible provider does not support image prompt generation. Use Gemini for image prompts.",
    );
  }

  async generateImage(_config: AppConfig, _story: Story): Promise<string> {
    throw new Error(
      "OpenAI compatible provider supports text only. Use Gemini or ComfyUI for images.",
    );
  }

  async generateAudio(
    _config: AppConfig,
    _story: Story,
  ): Promise<GeneratedAudio> {
    throw new Error(
      "OpenAI compatible provider supports text only. Use Gemini, Chatterbox, or Kokoro for narration.",
    );
  }

  async generateMusic(_config: AppConfig, _story: Story): Promise<string> {
    throw new Error(
      "OpenAI compatible provider supports text only. Use ComfyUI for music.",
    );
  }
}
