
import { configureStore } from '@reduxjs/toolkit';
import configReducer from './configSlice';
import storiesReducer from './storiesSlice';

export const store = configureStore({
  reducer: {
    config: configReducer,
    stories: storiesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
