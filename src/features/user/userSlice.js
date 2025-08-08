import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAdmin: false,
  token: "",
  userEmail: "",
  userId: "",
  userName: "",
  isAuthenticated: !!sessionStorage.getItem("token"),
};

export const userSlice = createSlice({
  name: "userInfo",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      console.log("payload", action.payload);
      const { token, userEmail, userId, userName } = action.payload;
      // state.value = {
      //   isAdmin: false,
      //   token: action.payload.token,
      //   userEmail: action.payload.userEmail,
      //   userId: action.payload.userId,
      //   userName: action.payload.userName,
      //   isAuthenticated: true,
      // };
      state.isAdmin = false;
      state.token = token;
      state.userEmail = userEmail;
      state.userId = userId;
      state.userName = userName;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.value = {
        isAdmin: false,
        token: "",
        userEmail: "",
        userId: "",
        userName: "",
        isAuthenticated: false,
      };
    },
  },
});

export const { loginSuccess, logout } = userSlice.actions;

export default userSlice.reducer;
