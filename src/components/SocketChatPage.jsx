import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import { chatAPI } from "../services/apiServices";
import { setChatRooms } from "../features/chat/chatSlice";
import { addMessage } from "../features/message/messageSlice";
import socketService from "../services/SocketService";

const SocketChatPage = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { selectedChat } = useSelector((state) => state.chat);

  // Fetch all chat rooms
  const { data: chatRoomsData, isLoading, refetch: refetchChatRooms } = useQuery({
    queryKey: ["chatRooms"],
    queryFn: chatAPI.getAllChatRooms,
    enabled: !!token,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Update chat rooms in Redux when data is fetched
  useEffect(() => {
    if (chatRoomsData?.data?.chatRooms) {
      dispatch(setChatRooms(chatRoomsData.data.chatRooms));
    }
  }, [chatRoomsData, dispatch]);

  // Initialize socket connection and event listeners
  useEffect(() => {
    if (token && user) {
      console.log("🔌 Initializing socket connection...");
      
      // Connect to socket
      const socket = socketService.connect(token);

      // Set up socket event listeners
      const setupSocketListeners = () => {
        // Listen for incoming messages
        socketService.onReceiveMessage((messageData) => {
          console.log("📨 Received message:", messageData);
          dispatch(
            addMessage({
              chatId: messageData.chatId,
              message: messageData,
            })
          );
        });

        // Listen for user joined room
        socketService.on("user_joined", (data) => {
          console.log("👤 User joined room:", data);
        });

        // Listen for user left room  
        socketService.on("user_left", (data) => {
          console.log("👋 User left room:", data);
        });

        // Listen for typing indicators
        socketService.on("user_typing", (data) => {
          console.log("⌨️ User typing:", data);
          // You can dispatch actions to update typing state here
        });

        socketService.on("user_stopped_typing", (data) => {
          console.log("⌨️ User stopped typing:", data);
          // You can dispatch actions to update typing state here
        });

        // Listen for message read receipts
        socketService.on("messages_read", (data) => {
          console.log("👀 Messages read:", data);
          // You can dispatch actions to update read receipts here
        });

        // Listen for user disconnection
        socketService.on("user_disconnected", (data) => {
          console.log("❌ User disconnected:", data);
        });

        // Listen for socket errors
        socketService.on("error_message", (error) => {
          console.error("⚠️ Socket error:", error);
          // You can show error notifications here
        });

        // Listen for connection events
        socketService.on("connect", () => {
          console.log("✅ Socket connected successfully");
        });

        socketService.on("disconnect", (reason) => {
          console.log("❌ Socket disconnected:", reason);
        });

        socketService.on("connect_error", (error) => {
          console.error("❌ Socket connection error:", error);
        });
      };

      // Set up listeners
      setupSocketListeners();

      // Cleanup function
      return () => {
        console.log("🧹 Cleaning up socket listeners...");
        socketService.offAllListeners();
        // Don't disconnect here as it might be used in other components
      };
    }
  }, [token, user, dispatch]);

  // Handle selected chat changes - join/leave rooms
  useEffect(() => {
    if (selectedChat?.roomId) {
      console.log("🏠 Joining room:", selectedChat.roomId);
      socketService.joinRoom(selectedChat.roomId);
      
      return () => {
        console.log("🚪 Leaving room:", selectedChat.roomId);
        socketService.leaveRoom(selectedChat.roomId);
      };
    }
  }, [selectedChat?.roomId]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading Chat App...</div>
          <div className="text-gray-500">Setting up your conversations</div>
        </div>
      </div>
    );
  }

  // Show error state if no token
  if (!token || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-600 mb-2">Authentication Required</div>
          <div className="text-gray-500 mb-4">Please log in to access the chat</div>
          <button
            onClick={() => window.location.href = "/login"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header Component */}
      <Header />
      
      {/* Main Chat Interface */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Sidebar */}
        <ChatSidebar />
        
        {/* Chat Window or Welcome Screen */}
        <div className="flex-1">
          {selectedChat ? (
            <ChatWindow />
          ) : (
            <div className="flex items-center justify-center h-full bg-white">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                  Welcome to Chat App
                </h2>
                <p className="text-gray-500 mb-6">
                  Select a chat from the sidebar to start messaging, or create a new chat to connect with someone.
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• Real-time messaging with Socket.IO</p>
                  <p>• Message read receipts</p>
                  <p>• Typing indicators</p>
                  <p>• Online status</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Connection Status Indicator (Optional) */}
      <ConnectionStatus />
    </div>
  );
};

// Optional connection status component
const ConnectionStatus = () => {
  const { token } = useSelector((state) => state.auth);
  
  // You can add socket connection status logic here
  // For now, it's a simple indicator
  
  // return null; // Remove this if you want to show connection status
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-600">Connected</span>
      </div>
    </div>
  );
};

export default SocketChatPage;