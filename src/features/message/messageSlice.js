import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: {},
  isLoading: false,
  error: null,
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      const { chatId, messages } = action.payload;
      state.messages[chatId] = messages;
    },
    addMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearMessages: (state, action) => {
      const chatId = action.payload;
      if (chatId) {
        delete state.messages[chatId];
      } else {
        state.messages = {};
      }
    },
  },
});

export const {
  setMessages,
  addMessage,
  setLoading,
  setError,
  clearMessages,
} = messageSlice.actions;

export default messageSlice.reducer;