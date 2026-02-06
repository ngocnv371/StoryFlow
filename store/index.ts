
import { configureStore } from '@reduxjs/toolkit';
import configReducer from './configSlice';
import storiesReducer from './storiesSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    config: configReducer,
    stories: storiesReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
