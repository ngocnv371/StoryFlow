import { Story } from '../types';

type YouTubePrivacyStatus = 'private' | 'public' | 'unlisted';

interface UploadVideoToYouTubeInput {
  videoBlob: Blob;
  story: Story;
  clientId: string;
  privacyStatus: YouTubePrivacyStatus;
  accessToken?: string;
  accessTokenExpiresAt?: number;
  onTokenRefresh?: (token: { accessToken: string; accessTokenExpiresAt: number }) => void;
}

interface UploadVideoToYouTubeResult {
  videoId: string;
  url: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

const YOUTUBE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let gsiLoadPromise: Promise<void> | null = null;

const loadGoogleIdentityScript = async (): Promise<void> => {
  if (window.google?.accounts?.oauth2) {
    return;
  }

  if (gsiLoadPromise) {
    return gsiLoadPromise;
  }

  gsiLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SCRIPT_SRC}"]`);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity script.'));
    document.head.appendChild(script);
  });

  return gsiLoadPromise;
};

interface AuthorizeYouTubeResult {
  accessToken: string;
  accessTokenExpiresAt: number;
}

const requestGoogleAccessToken = async (clientId: string, prompt: '' | 'consent'): Promise<AuthorizeYouTubeResult> => {
  await loadGoogleIdentityScript();

  return new Promise<AuthorizeYouTubeResult>((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: YOUTUBE_UPLOAD_SCOPE,
      callback: (response: any) => {
        if (response?.error) {
          reject(new Error(response.error_description || response.error || 'Google authorization failed.'));
          return;
        }

        if (!response?.access_token) {
          reject(new Error('Did not receive an access token from Google.'));
          return;
        }

        const expiresInSeconds = Number(response.expires_in) || 3600;
        const expiresAt = Date.now() + Math.max(0, expiresInSeconds - 60) * 1000;

        resolve({
          accessToken: response.access_token,
          accessTokenExpiresAt: expiresAt,
        });
      },
      error_callback: (error: any) => {
        reject(new Error(error?.message || 'Google authorization failed.'));
      },
    });

    tokenClient.requestAccessToken({ prompt });
  });
};

export const authorizeYouTube = async (clientId: string): Promise<AuthorizeYouTubeResult> => {
  if (!clientId.trim()) {
    throw new Error('YouTube OAuth Client ID is required. Configure it in Settings > Provider > YouTube Upload.');
  }

  return requestGoogleAccessToken(clientId.trim(), 'consent');
};

const isTokenValid = (accessToken?: string, accessTokenExpiresAt?: number): boolean => {
  if (!accessToken) {
    return false;
  }

  if (!accessTokenExpiresAt) {
    return true;
  }

  return accessTokenExpiresAt > Date.now();
};

const truncateDescription = (summary: string, transcript: string): string => {
  const base = summary?.trim() ? `${summary.trim()}\n\n` : '';
  const transcriptHeader = transcript?.trim() ? 'Transcript:\n' : '';
  const candidate = `${base}${transcriptHeader}${(transcript || '').trim()}`;

  if (candidate.length <= 5000) {
    return candidate;
  }

  return `${candidate.slice(0, 4997)}...`;
};

const normalizeTags = (tags: string[]): string[] => {
  const cleaned = tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 30);

  let total = 0;
  const limited: string[] = [];

  for (const tag of cleaned) {
    const nextTotal = total + tag.length;
    if (nextTotal > 500) break;
    limited.push(tag);
    total = nextTotal;
  }

  return limited;
};

export const uploadVideoToYouTube = async ({
  videoBlob,
  story,
  clientId,
  privacyStatus,
  accessToken,
  accessTokenExpiresAt,
  onTokenRefresh,
}: UploadVideoToYouTubeInput): Promise<UploadVideoToYouTubeResult> => {
  if (!clientId.trim()) {
    throw new Error('YouTube OAuth Client ID is required. Configure it in Settings > Provider > YouTube Upload.');
  }

  if (!videoBlob || videoBlob.size === 0) {
    throw new Error('Cannot upload an empty video file.');
  }

  let tokenToUse = accessToken;

  if (!isTokenValid(tokenToUse, accessTokenExpiresAt)) {
    let refreshedToken: AuthorizeYouTubeResult | null = null;

    try {
      refreshedToken = await requestGoogleAccessToken(clientId.trim(), '');
    } catch {
      refreshedToken = await requestGoogleAccessToken(clientId.trim(), 'consent');
    }

    tokenToUse = refreshedToken.accessToken;
    onTokenRefresh?.({
      accessToken: refreshedToken.accessToken,
      accessTokenExpiresAt: refreshedToken.accessTokenExpiresAt,
    });
  }

  const metadata = {
    snippet: {
      title: (story.title || 'StoryFlow Video').slice(0, 100),
      description: truncateDescription(story.summary || '', story.transcript || ''),
      tags: normalizeTags(story.tags || []),
      categoryId: '22',
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  };

  const boundary = `storyflow_${Date.now()}`;
  const body = new Blob(
    [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      `${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\n`,
      `Content-Type: ${videoBlob.type || 'video/webm'}\r\n\r\n`,
      videoBlob,
      '\r\n',
      `--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenToUse}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    let errorMessage = 'YouTube upload failed.';

    try {
      const data = await response.json();
      errorMessage = data?.error?.message || errorMessage;
    } catch {
      const text = await response.text();
      if (text) {
        errorMessage = text;
      }
    }

    throw new Error(errorMessage);
  }

  const result = await response.json();
  const videoId = result.id;

  if (!videoId) {
    throw new Error('YouTube upload succeeded but no video ID was returned.');
  }

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
};
