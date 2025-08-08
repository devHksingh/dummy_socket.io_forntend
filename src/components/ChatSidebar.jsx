import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Search, User, Circle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { setChatRooms, setSelectedChat } from "../features/chat/chatSlice";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const getAllChatRooms = async () => {
  const token = sessionStorage.getItem("token");
  console.log("token in header: ", token);
  const res = await axios.get(`https://dummy-socket-io-jnra.onrender.com/api/v1/chats/`, {
    headers: {
      Authorization: `${token}`,
    },
  });
  return res;
};

const getAllMessages = async (chatIds) => {
  const token = sessionStorage.getItem("token");
  console.log("token in header: ", token);
  const res = await axios.post(
    `https://dummy-socket-io-jnra.onrender.com/api/v1/messages/getAllMessagesByChatIds`,
    {
      chatIds,
    },
    {
      headers: {
        Authorization: `${token}`,
      },
    }
  );
  return res;
};

const ChatSidebar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState("");
  const [loginUserName, setLoginUserName] = useState("");
  const [loginUserId, setLoginUserId] = useState("");
  const [loginUserEmail, setLoginUserEmail] = useState("");

  const [allMessagesData, setAllMessagesData] = useState([]);
  const [userChatIds, setUserChatIds] = useState([]);
  const [allChatParticipants, setAllChatParticipants] = useState([]);
  const [userALLChatRooms, setuserALLChatRooms] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [usersTyping, setUsersTyping] = useState(new Map()); // Map of roomId -> Set of user IDs
  const [lastMessageUpdates, setLastMessageUpdates] = useState(new Map()); // Track real-time message updates
  const [
    userWithChatRoomWithParticipants,
    setUserWithChatRoomWithParticipants,
  ] = useState([]);

  // New state for unread message tracking
  const [unreadCounts, setUnreadCounts] = useState(new Map()); // Map of chatId -> unread count
  const [lastSeenMessages, setLastSeenMessages] = useState(new Map()); // Map of chatId -> last seen message timestamp

  const userOne = useSelector((state) => state.auth);
  const { chatRooms, selectedChat } = useSelector((state) => state.chat);
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (userOne) {
      console.log(
        "User Details Name id email are --:  ",
        userOne.userEmail,
        userOne.userId,
        userOne.userName
      );
      setLoginUserName(userOne.userName);
      setLoginUserId(userOne.userId);
      setLoginUserEmail(userOne.userEmail);
    }
  }, [userOne]);

  // Load last seen messages from sessionStorage (not localStorage to avoid restrictions)
  useEffect(() => {
    if (loginUserId) {
      const savedLastSeen = sessionStorage.getItem(
        `lastSeenMessages_${loginUserId}`
      );
      if (savedLastSeen) {
        try {
          const parsed = JSON.parse(savedLastSeen);
          setLastSeenMessages(new Map(Object.entries(parsed)));
          console.log("📖 Loaded last seen messages:", parsed);
        } catch (error) {
          console.error("Error parsing last seen messages:", error);
        }
      }
    }
  }, [loginUserId]);

  // Save last seen messages to sessionStorage whenever it changes
  useEffect(() => {
    if (lastSeenMessages.size > 0 && loginUserId) {
      const lastSeenObj = Object.fromEntries(lastSeenMessages);
      sessionStorage.setItem(
        `lastSeenMessages_${loginUserId}`,
        JSON.stringify(lastSeenObj)
      );
      console.log("💾 Saved last seen messages:", lastSeenObj);
    }
  }, [lastSeenMessages, loginUserId]);

  // Calculate unread counts whenever messages or last seen messages change
  useEffect(() => {
    if (loginUserId && userWithChatRoomWithParticipants.length > 0) {
      console.log("🔄 Calculating unread counts...");
      const newUnreadCounts = new Map();

      userWithChatRoomWithParticipants.forEach(({ chatId }) => {
        // Get messages for this chat from database
        const messagesForChat = allMessagesData.filter(
          (msg) =>
            msg.chatId &&
            (msg.chatId.roomId === chatId || msg.chatId._id === chatId)
        );

        // Get the last seen timestamp for this chat
        const lastSeenTimestamp = lastSeenMessages.get(chatId);

        // Count unread messages (messages after last seen timestamp that are not from current user)
        let unreadCount = 0;

        messagesForChat.forEach((msg) => {
          // Skip messages sent by current user
          if (msg.sender && msg.sender._id === loginUserId) {
            return;
          }

          // Use both createdAt and timestamp fields for compatibility
          const messageTimestamp = new Date(
            msg.createdAt || msg.timestamp
          ).getTime();

          // If no last seen timestamp, all messages from others are unread
          // If message is after last seen timestamp, it's unread
          if (
            !lastSeenTimestamp ||
            messageTimestamp > new Date(lastSeenTimestamp).getTime()
          ) {
            unreadCount++;
          }
        });

        // Check for socket updates that might be newer and from other users
        const socketUpdate = lastMessageUpdates.get(chatId);
        if (socketUpdate) {
          // Only count socket update if it's from another user
          const socketSenderId =
            socketUpdate.sender?._id || socketUpdate.sender;
          if (socketSenderId && socketSenderId !== loginUserId) {
            const socketTimestamp = new Date(socketUpdate.createdAt).getTime();
            if (
              !lastSeenTimestamp ||
              socketTimestamp > new Date(lastSeenTimestamp).getTime()
            ) {
              unreadCount++;
            }
          }
        }

        newUnreadCounts.set(chatId, unreadCount);
        console.log(`📊 Chat ${chatId}: ${unreadCount} unread messages`);
      });

      setUnreadCounts(newUnreadCounts);
      console.log(
        "📊 Total unread counts:",
        Object.fromEntries(newUnreadCounts)
      );
    }
  }, [
    allMessagesData,
    lastSeenMessages,
    userWithChatRoomWithParticipants,
    lastMessageUpdates,
    loginUserId,
  ]);

  // Initialize Socket.io connection for sidebar
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token || !userOne?.userId) {
      console.log("⏸️ Sidebar socket: No token or user, skipping connection");
      return;
    }

    console.log("🔌 Sidebar: Initializing Socket.io connection");

    // Initialize socket connection =>http://localhost:3001
    socketRef.current = io("https://dummy-socket-io-jnra.onrender.com", {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      forceNew: true,
      timeout: 10000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("✅ Sidebar: Connected to server:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Sidebar: Disconnected from server:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Sidebar: Connection error:", error.message);
      setIsConnected(false);
    });

    // Listen for successful room joins
    socket.on("room_joined", ({ roomId, chatId }) => {
      console.log(
        `✅ Sidebar: Successfully joined room ${roomId} for chat ${chatId}`
      );
    });

    // Listen for new messages across all rooms
    socket.on("receive_message", (message) => {
      console.log(
        "📨 Sidebar: Received message for room:",
        message.roomId,
        message
      );

      // Update the last message for this room with proper structure
      setLastMessageUpdates((prev) => {
        const newUpdates = new Map(prev);
        newUpdates.set(message.roomId, {
          text: message.text,
          createdAt:
            message.createdAt || message.timestamp || new Date().toISOString(),
          sender: message.sender, // This should be the populated sender object
          receiver: message.receiver,
        });
        return newUpdates;
      });

      // Refresh messages query to get updated data after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries(["allMessages"]);
      }, 500);
    });

    // User presence handlers
    socket.on("user_joined", ({ userId, userEmail }) => {
      console.log(`👋 Sidebar: ${userEmail} joined`);
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    socket.on("user_left", ({ userId, userEmail }) => {
      console.log(`👋 Sidebar: ${userEmail} left`);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socket.on("user_disconnected", ({ userId, userEmail }) => {
      console.log(`🔴 Sidebar: ${userEmail} disconnected`);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Typing indicators
    socket.on("user_typing", ({ userId, userEmail }) => {
      console.log(`⌨️ Sidebar: ${userEmail} is typing`);
    });

    socket.on("user_stopped_typing", ({ userId }) => {
      console.log(`⌨️ Sidebar: User ${userId} stopped typing`);
    });

    // Error handling
    socket.on("error_message", ({ type, message, error }) => {
      console.error(`❌ Sidebar Socket error [${type}]:`, message, error);
    });

    // Cleanup function
    return () => {
      if (socket) {
        socket.disconnect();
        console.log("🔌 Sidebar: Socket disconnected on cleanup");
      }
    };
  }, [userOne, queryClient]);

  // Join all user's chat rooms when socket connects
  useEffect(() => {
    if (socketRef.current && isConnected && userALLChatRooms?.length > 0) {
      console.log("🏠 Sidebar: Joining all user chat rooms");

      userALLChatRooms.forEach((chatRoom) => {
        const roomId = chatRoom._id; // Use _id as roomId from chat room data
        if (roomId) {
          console.log(`🏠 Sidebar: Joining room ${roomId}`);
          socketRef.current.emit("join_room", { roomId });
        }
      });
    }
  }, [isConnected, userALLChatRooms]);

  const { data, isError, error, isLoading } = useQuery({
    queryKey: ["getAllChatRooms"],
    queryFn: getAllChatRooms,
    refetchIntervalInBackground: true,
    staleTime: 120000, // 2 minutes
  });

  const {
    data: allMessages,
    isError: isErrorOnMessage,
    error: msgError,
    isLoading: isMsgLoading,
  } = useQuery({
    queryKey: ["allMessages", userChatIds],
    queryFn: () => getAllMessages(userChatIds),
    refetchIntervalInBackground: true,
    staleTime: 30000, // Reduced to 30 seconds for more frequent updates
    enabled: userChatIds.length > 0,
  });

  useEffect(() => {
    if (allMessages) {
      console.log(" allMessages api data : ", allMessages.data.messages);
      setAllMessagesData(allMessages.data.messages);
    }
  }, [allMessages]);

  useEffect(() => {
    if (data) {
      console.log(" getAllChatRooms api data : ", data.data.chatRooms);
      dispatch(setChatRooms(data.data.chatRooms));
      setuserALLChatRooms(data.data.chatRooms);
      const chatRoomData = data.data.chatRooms;
      const allChatIds = [];

      console.log("chatRoomData ---------: ", chatRoomData);

      const chatRoomWithParticipants = chatRoomData.map((chat) => {
        const chatId = chat._id;
        const participants = [];
        const chatParticipants = chat.participants || [];

        chatParticipants.forEach((participant) => {
          if (!participants.includes(participant)) {
            if (participant._id !== loginUserId) {
              participants.push(participant);
            }
          }
        });

        console.log("final chat room id with participants :", {
          chatId,
          participants,
        });
        return { chatId, participants };
      });

      setUserWithChatRoomWithParticipants(chatRoomWithParticipants);
      console.log(
        "#############chatRoomWithParticipants ###########",
        chatRoomWithParticipants
      );

      chatRoomData.forEach((chat) => {
        const chatId = chat._id;
        console.log("------chatId ------ : ", chatId);
        allChatIds.push(chatId);
      });

      console.log("-----allChatIds----- : ", allChatIds);
      setUserChatIds(allChatIds);
    }
  }, [data, dispatch, loginUserId]);

  // Mark messages as read when a chat is selected
  const markChatAsRead = (chatId) => {
    const now = new Date().toISOString();
    console.log(`✅ Marking chat ${chatId} as read at ${now}`);

    setLastSeenMessages((prev) => {
      const newMap = new Map(prev);
      newMap.set(chatId, now);
      return newMap;
    });

    // Reset unread count for this chat immediately
    setUnreadCounts((prev) => {
      const newMap = new Map(prev);
      newMap.set(chatId, 0);
      return newMap;
    });

    // Also clear any socket updates for this chat since they're now read
    setLastMessageUpdates((prev) => {
      const newMap = new Map(prev);
      // Don't delete the update, but mark it as read by updating our last seen timestamp
      return newMap;
    });
  };

  const handleChatSelect = (chatRoomInfo) => {
    console.log("📱 Sidebar: Chat selected:", chatRoomInfo);

    // Mark this chat as read
    markChatAsRead(chatRoomInfo.chatId);

    // Create a consistent chat object structure for the selected chat
    const chatToSelect = {
      chatId: {
        roomId: chatRoomInfo.chatId,
        _id: chatRoomInfo.chatId,
      },
      otherParticipant: chatRoomInfo.otherParticipant,
      participants: chatRoomInfo.participants,
    };

    dispatch(setSelectedChat(chatToSelect));
  };

  // Create a comprehensive list of all chat rooms (including those without messages)
  const getAllChatsWithMessages = () => {
    const chatRoomsWithMessages = [];

    // Process all chat rooms from userWithChatRoomWithParticipants
    userWithChatRoomWithParticipants.forEach((chatRoom) => {
      const { chatId, participants } = chatRoom;

      // Get the other participant (first non-current user)
      const otherParticipant = participants.length > 0 ? participants[0] : null;

      // Find the latest message for this chat room from API data
      const messagesForThisRoom = allMessagesData.filter(
        (msg) =>
          msg.chatId &&
          (msg.chatId.roomId === chatId || msg.chatId._id === chatId)
      );

      // Get the latest message or check socket updates
      let latestMessage = null;
      let lastMessageTime = null;

      if (messagesForThisRoom.length > 0) {
        // Sort messages by creation time and get the latest
        const sortedMessages = messagesForThisRoom.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.timestamp).getTime();
          const timeB = new Date(b.createdAt || b.timestamp).getTime();
          return timeB - timeA;
        });
        latestMessage = sortedMessages[0];
        lastMessageTime = latestMessage.createdAt || latestMessage.timestamp;
      }

      // Check if there's a more recent message from socket updates
      const socketUpdate = lastMessageUpdates.get(chatId);
      if (
        socketUpdate &&
        (!lastMessageTime ||
          new Date(socketUpdate.createdAt) > new Date(lastMessageTime))
      ) {
        latestMessage = {
          text: socketUpdate.text,
          createdAt: socketUpdate.createdAt,
          sender: socketUpdate.sender,
          receiver: socketUpdate.receiver,
        };
        lastMessageTime = socketUpdate.createdAt;
      }

      // Get unread count for this chat
      const unreadCount = unreadCounts.get(chatId) - 1 || 0;

      // Create the chat item with all necessary information
      chatRoomsWithMessages.push({
        chatId,
        participants,
        otherParticipant: otherParticipant
          ? {
              id: otherParticipant._id,
              name: otherParticipant.name,
              email: otherParticipant.email,
            }
          : null,
        latestMessage: latestMessage,
        lastMessageTime: lastMessageTime || new Date(0), // Use epoch time if no messages
        text: latestMessage?.text || "No messages yet",
        createdAt: lastMessageTime || new Date().toISOString(),
        hasMessages: messagesForThisRoom.length > 0 || !!socketUpdate,
        unreadCount: unreadCount, // Add unread count to chat object
      });
    });

    // Sort by last message time (most recent first), but keep chats without messages at the end
    return chatRoomsWithMessages.sort((a, b) => {
      // If both have messages, sort by message time
      if (a.hasMessages && b.hasMessages) {
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      }
      // If only one has messages, prioritize the one with messages
      if (a.hasMessages && !b.hasMessages) return -1;
      if (!a.hasMessages && b.hasMessages) return 1;
      // If neither has messages, sort alphabetically by participant name
      const nameA = a.otherParticipant?.name || "";
      const nameB = b.otherParticipant?.name || "";
      return nameA.localeCompare(nameB);
    });
  };

  // Get all chats with messages
  const allChatsWithMessages = getAllChatsWithMessages();

  // Filter chats based on search query
  const filteredChats = allChatsWithMessages.filter((chat) => {
    if (!searchQuery) return true;

    return (
      chat.otherParticipant?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) || false
    );
  });

  // Connection status indicator for sidebar
  const ConnectionStatus = () => (
    <div className="px-4 py-2 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Circle
            className={`w-2 h-2 fill-current ${
              isConnected ? "text-green-500" : "text-red-500"
            }`}
          />
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
        {onlineUsers.size > 0 && (
          <span className="text-xs text-green-500">
            {onlineUsers.size - 1} online
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
      {/* Connection Status */}
      <ConnectionStatus />

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search chats by UserName"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <User className="text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 mb-2">No chats found</p>
            <p className="text-sm text-gray-400">
              {searchQuery
                ? "Try a different search term"
                : "Start a new chat to begin messaging"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredChats.map((chat) => (
              <ChatItem
                key={chat.chatId}
                chat={chat}
                isSelected={
                  selectedChat?.chatId?.roomId === chat.chatId ||
                  selectedChat?.chatId?._id === chat.chatId
                }
                onClick={() => handleChatSelect(chat)}
                otherParticipant={chat.otherParticipant}
                isOnline={onlineUsers.has(chat.otherParticipant?.id)}
                isConnected={isConnected}
                unreadCount={chat.unreadCount} // Pass unread count to ChatItem
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatItem = ({
  chat,
  isSelected,
  onClick,
  otherParticipant,
  isOnline,
  isConnected,
  unreadCount,
}) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
        isSelected ? "bg-blue-50 border-r-2 border-blue-500" : ""
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {otherParticipant?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          {/* Online status indicator */}
          {isConnected && isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          )}
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3
              className={`font-medium truncate flex items-center ${
                unreadCount > 0
                  ? "text-gray-900 font-semibold"
                  : "text-gray-700"
              }`}
            >
              {otherParticipant?.name || "Unknown User"}
              {/* Online status text for screen readers */}
              {isConnected && isOnline && (
                <span className="ml-2 text-xs text-green-500">●</span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {chat.hasMessages &&
                new Date(chat.lastMessageTime).getTime() > 0
                  ? formatTime(chat.lastMessageTime)
                  : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p
              className={`text-sm truncate flex-1 ${
                unreadCount > 0
                  ? "text-gray-800 font-medium"
                  : chat.hasMessages
                  ? "text-gray-600"
                  : "text-gray-400 italic"
              }`}
            >
              {chat.text || "No messages yet"}
            </p>
            {/* Additional unread count indicator (optional) */}
            {unreadCount > 0 && (
              <div className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <Circle
            className={`w-3 h-3 ${
              isConnected && isOnline ? "text-green-500" : "text-gray-300"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
