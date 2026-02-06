
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
}

interface UIState {
  alert: AlertState;
}

const initialState: UIState = {
  alert: {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showAlert: (state, action: PayloadAction<{ title: string; message: string; type?: AlertType }>) => {
      state.alert = {
        isOpen: true,
        title: action.payload.title,
        message: action.payload.message,
        type: action.payload.type || 'info',
      };
    },
    hideAlert: (state) => {
      state.alert.isOpen = false;
    },
  },
});

export const { showAlert, hideAlert } = uiSlice.actions;
export default uiSlice.reducer;
