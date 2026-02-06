
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppConfig, TextGenConfig, AudioGenConfig } from '../types';

const initialState: AppConfig = {
  textGen: {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-3-flash-preview',
    endpoint: '',
  },
  audioGen: {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.5-flash-preview-tts',
  },
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setTextGenConfig: (state, action: PayloadAction<Partial<TextGenConfig>>) => {
      state.textGen = { ...state.textGen, ...action.payload };
    },
    setAudioGenConfig: (state, action: PayloadAction<Partial<AudioGenConfig>>) => {
      state.audioGen = { ...state.audioGen, ...action.payload };
    },
  },
});

export const { setTextGenConfig, setAudioGenConfig } = configSlice.actions;
export default configSlice.reducer;
