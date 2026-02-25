import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setComfyConfig, setGeminiConfig, setYouTubeConfig } from '../../store/configSlice';
import { authorizeYouTube } from '../../services/youtube';
import { showAlert } from '../../store/uiSlice';

const ProviderSettingsTab: React.FC = () => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);
  const [isAuthorizingYouTube, setIsAuthorizingYouTube] = useState(false);

  const hasValidYouTubeToken = Boolean(
    config.youtube.accessToken &&
    (!config.youtube.accessTokenExpiresAt || config.youtube.accessTokenExpiresAt > Date.now())
  );

  const handleAuthorizeYouTube = async () => {
    if (!config.youtube.clientId?.trim()) {
      dispatch(showAlert({
        title: 'YouTube Client ID Required',
        message: 'Add your YouTube OAuth Client ID before authorizing.',
        type: 'error',
      }));
      return;
    }

    setIsAuthorizingYouTube(true);

    try {
      const token = await authorizeYouTube(config.youtube.clientId);
      dispatch(setYouTubeConfig({
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
      }));

      dispatch(showAlert({
        title: 'YouTube Authorized',
        message: 'Access token saved. Future uploads can reuse this authorization.',
        type: 'success',
      }));
    } catch (error: any) {
      dispatch(showAlert({
        title: 'Authorization Failed',
        message: error?.message || 'Could not authorize YouTube.',
        type: 'error',
      }));
    } finally {
      setIsAuthorizingYouTube(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-800">Gemini</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key</label>
          <input
            type="password"
            value={config.gemini.apiKey}
            placeholder="Enter your Gemini API key"
            onChange={(e) => dispatch(setGeminiConfig({ apiKey: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Text Model Name</label>
          <input
            type="text"
            value={config.gemini.textModel}
            placeholder="gemini-3-flash-preview"
            onChange={(e) => dispatch(setGeminiConfig({ textModel: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Audio Model Name</label>
          <input
            type="text"
            value={config.gemini.audioModel}
            placeholder="gemini-2.5-flash-preview-tts"
            onChange={(e) => dispatch(setGeminiConfig({ audioModel: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Image Model Name</label>
          <input
            type="text"
            value={config.gemini.imageModel}
            placeholder="gemini-2.5-flash-image"
            onChange={(e) => dispatch(setGeminiConfig({ imageModel: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-800">ComfyUI</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ComfyUI URL</label>
          <input
            type="text"
            value={config.comfy.endpoint}
            placeholder="http://127.0.0.1:8188/prompt"
            onChange={(e) => dispatch(setComfyConfig({ endpoint: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ComfyUI API Key</label>
          <input
            type="password"
            value={config.comfy.apiKey}
            placeholder="Enter your ComfyUI API token"
            onChange={(e) => dispatch(setComfyConfig({ apiKey: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ComfyUI Model</label>
          <input
            type="text"
            value={config.comfy.model || ''}
            placeholder="Optional ComfyUI model name"
            onChange={(e) => dispatch(setComfyConfig({ model: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-800">YouTube Upload</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">OAuth Client ID</label>
          <input
            type="text"
            value={config.youtube.clientId}
            placeholder="Paste your Google OAuth 2.0 Web Client ID"
            onChange={(e) => dispatch(setYouTubeConfig({ clientId: e.target.value, accessToken: '', accessTokenExpiresAt: 0 }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <p className="text-xs text-slate-500 mt-1">Enable YouTube Data API v3 and add your app origin to Authorized JavaScript origins.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Authorization</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAuthorizeYouTube}
              disabled={isAuthorizingYouTube}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isAuthorizingYouTube
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isAuthorizingYouTube ? 'Authorizing...' : 'Authorize YouTube'}
            </button>
            <span className={`text-xs ${hasValidYouTubeToken ? 'text-emerald-600' : 'text-slate-500'}`}>
              {hasValidYouTubeToken ? 'Access token ready' : 'No active access token'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Default Privacy</label>
          <select
            value={config.youtube.privacyStatus}
            onChange={(e) => dispatch(setYouTubeConfig({ privacyStatus: e.target.value as 'private' | 'public' | 'unlisted' }))}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProviderSettingsTab;
