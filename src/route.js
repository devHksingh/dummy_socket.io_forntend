import { createBrowserRouter } from "react-router";
import App from "./App";
import HomeLayout from "./layout/HomeLayout";
import AuthLayout from "./layout/AuthLayout";
// import Chatpage from "./components/Chatpage";
import Login from "./components/Login"
import Register from "./components/Register"
// import ChatApp from "./components/ChatApp"
// import NewChatApp from "./components/NewChatApp"
// import SocketChatPage from "./components/SocketChatPage";
import ChatPage from "./components/Chatpage"

const router = createBrowserRouter([
  {
    path: "/",
    Component: HomeLayout,
    children: [
      { index: true, Component: App },
      {
        path: "auth",
        Component: AuthLayout,
        children: [
          { path: "login", Component: Login },
          { path: "register", Component: Register },
        ],
      },
      // { path: "chat", Component: Chatpage },
      { path: "chat", Component: ChatPage },
    ],
  },
]);

export default router;

// Chatpage
