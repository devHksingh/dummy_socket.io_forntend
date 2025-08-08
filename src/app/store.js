import { configureStore } from "@reduxjs/toolkit";
import authSlice from "../features/user/userSlice.js"
import chatSlice from "../features/chat/chatSlice.js";
import messageSlice from "../features/message/messageSlice.js"


export const store = configureStore({
  reducer: {
    auth: authSlice,
    chat: chatSlice,
    message: messageSlice,
  },
});
