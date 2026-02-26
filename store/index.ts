
import { configureStore } from '@reduxjs/toolkit';
import configReducer, { saveConfigToStorage } from './configSlice';
import storiesReducer from './storiesSlice';

export const store = configureStore({
  reducer: {
    config: configReducer,
    stories: storiesReducer,
  },
});

// Subscribe to store changes and persist config to localStorage
store.subscribe(() => {
  const state = store.getState();
  saveConfigToStorage(state.config);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
