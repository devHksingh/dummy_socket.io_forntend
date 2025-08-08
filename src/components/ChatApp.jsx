import React, { useState, useEffect } from "react";
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
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { addInfo } from "../features/user/userSlice";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import z from "zod";
import { toast, ToastContainer } from "react-toastify";

const userSearchSchema = z.object({
  user: z.string().min(1, "User Name or Email is required"),
});

const ChatApp = () => {
  const [selectedChat, setSelectedChat] = useState(0);
  const [userInfo, setUserInfo] = useState({});
  const [message, setMessage] = useState("");
  const [notificationCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const userInfoState = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (userInfoState) {
      console.log("userInfoState", userInfoState);
      setUserInfo(userInfoState);
      console.log("userInfoState.token", userInfoState.token);
      setLoading(false);
    }
  }, [userInfoState]);

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
        setLoading(false);
      } else {
        // No token found, redirect to login
        navigate("/auth/login");
      }
    } else {
      setLoading(false);
    }
  }, [navigate, userInfoState, dispatch]);

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("isAdmin");

    // Clear Redux state (you might need to create a logout action)
    // dispatch(clearUser());

    // Navigate to login
    navigate("/auth/login");
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Sample chat data
  const chats = [
    {
      id: 1,
      name: "Alice Johnson",
      lastMessage: "Hey! How are you doing?",
      time: "2:30 PM",
      unread: 2,
      avatar: "AJ",
      online: true,
    },
    {
      id: 2,
      name: "Work Group",
      lastMessage: "Meeting at 3 PM today",
      time: "1:45 PM",
      unread: 5,
      avatar: "WG",
      online: false,
      isGroup: true,
    },
    {
      id: 3,
      name: "Bob Smith",
      lastMessage: "Thanks for the help!",
      time: "12:20 PM",
      unread: 0,
      avatar: "BS",
      online: false,
    },
    {
      id: 4,
      name: "Family Group",
      lastMessage: "See you all at dinner",
      time: "11:30 AM",
      unread: 1,
      avatar: "FG",
      online: false,
      isGroup: true,
    },
    {
      id: 5,
      name: "Sarah Wilson",
      lastMessage: "Let's catch up soon!",
      time: "Yesterday",
      unread: 0,
      avatar: "SW",
      online: true,
    },
  ];

  // Sample messages for the selected chat
  const messages = [
    {
      id: 1,
      text: "Hey! How are you doing?",
      sender: "other",
      time: "2:25 PM",
    },
    {
      id: 2,
      text: "I'm doing great! Just finished a big project at work.",
      sender: "me",
      time: "2:26 PM",
    },
    {
      id: 3,
      text: "That's awesome! What kind of project was it?",
      sender: "other",
      time: "2:27 PM",
    },
    {
      id: 4,
      text: "It was a new chat application with React. Really excited about how it turned out!",
      sender: "me",
      time: "2:28 PM",
    },
    {
      id: 5,
      text: "Sounds interesting! I'd love to see it sometime.",
      sender: "other",
      time: "2:30 PM",
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Here you would typically add the message to your state/database
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Chat List */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
        {/* Top Header */}
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

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200">
          <form>
            <div className="relative flex gap-1">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search or start new chat"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </div>
          </form>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat, index) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(index)}
              className={`flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedChat === index
                  ? "bg-green-50 border-r-4 border-r-green-500"
                  : ""
              }`}
            >
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-3 ${
                    chat.isGroup ? "bg-blue-500" : "bg-green-500"
                  }`}
                >
                  {chat.avatar}
                </div>
                {chat.online && (
                  <div className="absolute bottom-0 right-3 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {chat.time}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-600 truncate">
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3 ${
                chats[selectedChat]?.isGroup ? "bg-blue-500" : "bg-green-500"
              }`}
            >
              {chats[selectedChat]?.avatar}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {chats[selectedChat]?.name}
              </h2>
              <p className="text-sm text-gray-500">
                {chats[selectedChat]?.online ? "Online" : "Last seen recently"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Phone size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Video size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 bg-opacity-50">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "me" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender === "me"
                      ? "bg-green-500 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender === "me" ? "text-green-100" : "text-gray-500"
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSendMessage}
              className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={!message.trim()}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ChatApp;
