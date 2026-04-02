![Upload Demo](assets/story-flow-banner.png)

# StoryFlow

StoryFlow is an authenticated AI storytelling studio for creating and managing story projects end-to-end:

- generate transcript drafts from a summary
- generate cover images
- generate narration audio
- generate background music
- compile a final video
- save media to Supabase storage and optionally post to YouTube

It uses Supabase for auth/data/storage, Redux for app state, and pluggable generation providers (Gemini + ComfyUI + OpenAI compatible + Chatterbox + Kokoro).

## Current Features

![Demo 1](assets/demo1.png)

### App pages

- **Login / Sign Up** via Supabase Auth
- **Overview dashboard** with project stats + recent activity
- **Projects** list with status filter and AI idea generation
- **Story Detail** editor with transcript + metadata + media generators

### Generation tools in Story Detail

- **Magic Transcript** (text generation)
- **Cover generation** (image generation)
- **Narration generation** (TTS)
- **Background music generation**
- **Video compilation** (WebM) with:
  - local preview
  - download
  - save to Supabase storage
  - post to YouTube
- **Auto Generate** pipeline to run selected steps in sequence

### Settings (stored in localStorage)

- Provider config per generation type (`text`, `image`, `narration`, `music`)
- Gemini API key + model names
- ComfyUI endpoint/API key/model
- Image settings (width/height/cfg)
- Narration settings (voice/speed)
- Video effects toggles (Ken Burns / Particles)
- YouTube OAuth client + default privacy + token reuse

## Tech Stack

- React 19 + TypeScript + Vite
- Redux Toolkit + React Redux
- React Router (HashRouter)
- Supabase (`@supabase/supabase-js`)
- Google GenAI SDK (`@google/genai`)
- Recharts (dashboard visuals)
- MediaBunny + browser media APIs for video compilation

## Provider Capability Matrix

| Generation type | Gemini | ComfyUI | OpenAI compatible | Chatterbox | Kokoro |
| --- | --- | --- | --- | --- | --- |
| Text / transcript / ideas | ✅ | ❌ | ✅ | ❌ | ❌ |
| Cover image | ✅ | ✅ | ❌ | ❌ | ❌ |
| Narration audio | ✅ | ❌ | ❌ | ✅ | ✅ |
| Background music | ❌ | ✅ | ❌ | ❌ | ❌ |

If you set an unsupported provider for a generation type, StoryFlow will surface an error in the UI.

## Local Development

### Prerequisites

- Node.js 20+
- A Supabase project
- A Gemini API key (required for text and narration, optional for image if using ComfyUI)
- A ComfyUI endpoint (required for music, optional for image)
- A Chatterbox endpoint (optional, for narration if selected)
- A Kokoro endpoint (optional, for narration if selected)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure Supabase project connection

This repo currently has Supabase URL/anon key defined directly in `supabaseClient.ts`.

Update these values to your own project before running in shared/public environments.

Optional bucket env overrides (defaults shown):

- `VITE_SUPABASE_PUBLIC_ASSETS_BUCKET=public-assets`
- `VITE_SUPABASE_PRIVATE_ASSETS_BUCKET=private-assets`
- `VITE_SUPABASE_IMAGE_BUCKET=public-assets`
- `VITE_SUPABASE_AUDIO_BUCKET=public-assets`
- `VITE_SUPABASE_MUSIC_BUCKET=public-assets`
- `VITE_SUPABASE_VIDEO_BUCKET=public-assets`

### 3) Create database schema + storage

Run `supabase_schema.sql` in your Supabase SQL editor.

This sets up:

- `profiles` and `stories` tables
- RLS policies
- storage buckets/policies for generated assets

### 4) Run the app

```bash
npm run dev
```

Then open the local Vite URL (usually `http://localhost:5173`).

### Local Chatterbox TTS API (Docker)

If you want to use a local Chatterbox narration backend, you can run:

- Repo: https://github.com/travisvn/chatterbox-tts-api or one of the spawned forks.

1. Start the API container:

```bash
docker run -p 4123:4123 -e USE_MULTILINGUAL_MODEL=false --gpus=all hanseware/chatterbox-tts-api:uv.gpu-20260225
```

2. Replace the default voice sample inside the running container:

```bash
docker cp /path/to/your-sample-voice.mp3 <container-id>:/app/voice-sample.mp3
```

To find the container ID if needed:

```bash
docker ps
```

3. In StoryFlow settings, set the Chatterbox endpoint to your local API (for example: `http://<local-ip>:5123`).

4. Create a voice through the api with a provided example in [/assets/voices/female_shadowheart4.flac]

5. Built-in Voices
   - jessica
   - elaine
   - rupert

#### Chatterbox troubleshooting (missing `peft`)

If you see this in the Chatterbox container logs:

```text
/app/.venv/lib/python3.11/site-packages/diffusers/models/lora.py:393: FutureWarning: `LoRACompatibleLinear` is deprecated and will be removed in version 1.0.0. Use of `LoRACompatibleLinear` is deprecated. Please switch to PEFT backend by installing PEFT: `pip install peft`.
   deprecate("LoRACompatibleLinear", "1.0.0", deprecation_message)
✗ Failed to initialize model: 'NoneType' object is not callable
```

This usually means the image is missing the `peft` package. As a workaround (since this is not our image), enter the container and run:

```bash
/app/.venv/bin/virtualenv /app/.venv --seed=pip
/app/.venv/bin/python -m pip install peft
```

Then restart the container.

### Browser CORS workaround for local Chatterbox

When calling a local Chatterbox API from the browser, CORS may block direct requests. One option is to run a CORS proxy container:

```bash
docker run -p 8080:8080 cors-anywhere
```

Then proxy requests through:

`http://localhost:8080/<local-ip>:5123/v1/audio/speech`

## First-Time App Setup (inside UI)

1. Sign up / log in.
2. Open **Settings**.
3. In **Provider** tab:
   - paste Gemini API key
   - set ComfyUI endpoint if using Comfy-based generation
   - set Chatterbox endpoint if using Chatterbox narration
   - set Kokoro endpoint if using Kokoro narration
4. In generation tabs, choose provider per task type.
5. Create a new project from **Overview** or **Projects**.

## Typical Workflow

1. Create project (or generate project ideas in bulk).
2. Fill title + summary.
3. Generate transcript.
4. Generate cover + narration (+ music if configured).
5. Compile video.
6. Save video to cloud and/or download.
7. Optionally post compiled video to YouTube.

## YouTube Upload Setup

To enable the **Post to YouTube** action:

1. In Google Cloud Console, create/select a project.
2. Enable **YouTube Data API v3**.
3. Configure OAuth consent screen.
4. Create an OAuth 2.0 Client ID (**Web application**).
5. Add your app origin to **Authorized JavaScript origins**.
   - local dev example: `http://localhost:5173`
6. In StoryFlow: **Settings → Provider → YouTube Upload**:
   - paste OAuth Client ID
   - click **Authorize YouTube**
   - choose default privacy (`unlisted` / `private` / `public`)

Uploads use story title, summary/transcript, tags, and selected privacy status.

## NPM Scripts

- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run preview` — preview production build locally

## Project Structure (high level)

- `pages/` — routed screens (`Home`, `Projects`, `StoryDetail`, `Login`)
- `components/` — generators, settings tabs, layout, dialogs
- `services/ai/` — provider factories, prompts, storage utilities
- `services/youtube.ts` — OAuth token flow + upload logic
- `store/` — Redux slices for stories/config/UI
- `context/AuthContext.tsx` — Supabase auth session handling

## Notes

- StoryFlow uses `HashRouter`, which is friendly for static hosting.
- Transcript generation is designed around a soft character limit (`3000`) for narration generation.
- Video compilation depends on modern browser media APIs; Chromium-based browsers are recommended.
