import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chatRooms: [],
  selectedChat: null,
  onlineUsers: [],
  typingUsers: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChatRooms: (state, action) => {
      state.chatRooms = action.payload;
    },
    addChatRoom: (state, action) => {
      state.chatRooms.push(action.payload);
    },
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    addOnlineUser: (state, action) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    removeOnlineUser: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter(user => user !== action.payload);
    },
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state, action) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action) => {
      state.typingUsers = state.typingUsers.filter(user => user !== action.payload);
    },
  },
});

export const {
  setChatRooms,
  addChatRoom,
  setSelectedChat,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
} = chatSlice.actions;

export default chatSlice.reducer;