<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1a-CLxzUOM9dp6ZMJwc7sjMrioebXXdEb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## YouTube Upload Setup (Post to YouTube button)

1. In Google Cloud Console, create/select a project.
2. Enable **YouTube Data API v3** for that project.
3. Configure OAuth consent screen (External or Internal) and add test users if needed.
4. Create an **OAuth 2.0 Client ID** of type **Web application**.
5. Add your app origin(s) under **Authorized JavaScript origins** (for local dev: `http://localhost:3000`).
6. Open StoryFlow → **Settings** → **Provider** → **YouTube Upload** and paste the OAuth Client ID.
7. Compile a video, then click **Post to YouTube** next to **Download Video**.

The upload uses your current story title, summary, transcript, tags, and the configured privacy status.
