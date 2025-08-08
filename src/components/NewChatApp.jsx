import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { addInfo } from "../features/user/userSlice";
import {
  Search,
  Bell,
  LogOut,
  User,
  Send,
  MoreVertical,
  Phone,
  Video,
} from "lucide-react";
// import SideBar from "./SideBar"
// import ChatShown from "./ChatShown"
import SideBar from "./SideBar"
import ChatShown from "./ChatShown"

const NewChatApp = () => {
  const [authLoading, setAuthLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({});
  const [notificationCount] = useState(3);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userInfoState = useSelector((state) => state.user.value);

  useEffect(() => {
    if (userInfoState) {
      console.log("userInfoState", userInfoState);
      setUserInfo(userInfoState);
      console.log("userInfoState.token", userInfoState.token);
      setAuthLoading(false);
    }
  }, [userInfoState]);

  //   auth check
  useEffect(() => {
    // Check if userInfoState exists and has token property
    if (!userInfoState || !userInfoState.token) {
      const token = sessionStorage.getItem("token");
      const userName = sessionStorage.getItem("userName");
      const userEmail = sessionStorage.getItem("userEmail");
      const userId = sessionStorage.getItem("userId");
      const isAdmin = sessionStorage.getItem("isAdmin");

      if (token) {
        const loginUserData = {
          token,
          userName,
          userEmail,
          userId,
          isAdmin,
        };
        dispatch(addInfo(loginUserData));
        setAuthLoading(false);
      } else {
        // No token found, redirect to login
        navigate("/auth/login");
      }
    } else {
      setAuthLoading(false);
    }
  }, [navigate, userInfoState, dispatch]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("isAdmin");
    sessionStorage.clear();

    // Clear Redux state (you might need to create a logout action)
    // dispatch(clearUser());

    // Navigate to login
    navigate("/auth/login", { replace: true });
  };
  return (
    <div className="h-screen bg-gray-100">
      {/* header */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center hover:bg-green-800 transition-colors">
            <User size={20} />
          </button>
          <span className="font-semibold capitalize">
            {userInfo?.userName || "User"}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2  hover:bg-green-700 rounded-full transition-colors">
            <Search size={20} />
          </button>
          <button className="relative p-2 hover:bg-green-700 rounded-full transition-colors">
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-green-700 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
      <div className="flex min-h-[90%] scroll-auto ">
        <SideBar/>
        <ChatShown/>
      </div>
    </div>
  );
};

export default NewChatApp;
