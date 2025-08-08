import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, User, Circle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { io } from "socket.io-client";

const formSchema = z.object({
  message: z.string().min(1, "Text Message is required"),
});

const gettAllMessagesByChatId = async (id) => {
  const token = sessionStorage.getItem("token");
  console.log("AXIOS CHAT ID :", id);

  console.log("token in header: ", token);
  const res = await axios.post(
    ` https://dummy-socket-io-jnra.onrender.com/api/v1/messages/getAllMessagesByChatIds`,
    {
      chatIds: [`${id}`],
    },
    {
      headers: {
        Authorization: `${token}`,
      },
    }
  );
  return res;
};

// post method for send message to another user it need chatId and text in req.body
const createAMessage = async ({ chatId, text }) => {
  const token = sessionStorage.getItem("token");
  const res = await axios.post(
    ` https://dummy-socket-io-jnra.onrender.com/api/v1/messages/`,
    {
      chatId,
      text,
    },
    {
      headers: {
        Authorization: `${token}`,
      },
    }
  );
  return res;
};

const ChatWindow = () => {
  const [chatId, setChatId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loginUserName, setLoginUserName] = useState("");
  const [loginUserId, setLoginUserId] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [loginUserEmail, setLoginUserEmail] = useState("");
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const [messageText, setMessageText] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderId, setSenderId] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // Changed this to store user details instead of just IDs
  const [usersTyping, setUsersTyping] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  const { selectedChat } = useSelector((state) => state.chat);
  const { messages } = useSelector((state) => state.message);
  const userOne = useSelector((state) => state.auth);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short", // "Aug"
      day: "numeric", // "7"
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Initialize Socket.io connection
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      toast.error("No authentication token found. Please login again.");
      return;
    }

    console.log("🔌 Initializing Socket.io connection with token:", token.substring(0, 20) + "...");
    // https://dummy-socket-io-jnra.onrender.com  => http://localhost:3001
    // Initialize socket connection
    socketRef.current = io("https://dummy-socket-io-jnra.onrender.com", {
      auth: {
        token: token, // Make sure token includes "Bearer " prefix if required
      },
      transports: ["websocket", "polling"],
      forceNew: true,
      timeout: 10000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from server:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      setIsConnected(false);
      toast.error("Failed to connect to chat server");
    });

    // Message event handlers
    socket.on("receive_message", (message) => {
      console.log("📨 Received message:", message);
      setAllMessages((prevMessages) => {
        // Check if message already exists to prevent duplicates
        const messageExists = prevMessages.some(msg => msg._id === message._id);
        if (messageExists) return prevMessages;
        
        return [...prevMessages, message];
      });
      
      // Auto-scroll to bottom when new message arrives
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    // Typing indicators - Updated to store user details
    socket.on("user_typing", ({ userId, userEmail, userName }) => {
      console.log(`👤 ${userName} is typing...`);
      // Don't show typing indicator for current user
      if (userId !== loginUserId) {
        setUsersTyping((prev) => {
          const newMap = new Map(prev);
          newMap.set(userId, { 
            userEmail: userEmail || 'Unknown User', 
            userName: userName || userEmail || 'Someone' 
          });
          return newMap;
        });
      }
    });

    socket.on("user_stopped_typing", ({ userId }) => {
      setUsersTyping((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    });

    // User presence handlers
    socket.on("user_joined", ({ userId, userEmail }) => {
      console.log(`👋 ${userEmail} joined the room`);
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    socket.on("user_left", ({ userId, userEmail }) => {
      console.log(`👋 ${userEmail} left the room`);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socket.on("user_disconnected", ({ userId, userEmail }) => {
      console.log(`🔴 ${userEmail} disconnected`);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Error handling
    socket.on("error_message", ({ type, message, error }) => {
      console.error(`❌ Socket error [${type}]:`, message, error);
      toast.error(`${message}${error ? ': ' + error : ''}`);
    });

    // Read receipts
    socket.on("messages_read", ({ userId, roomId }) => {
      console.log(`✅ Messages read by user ${userId} in room ${roomId}`);
      // You can update UI to show read status
    });

    // Cleanup function
    return () => {
      if (socket) {
        socket.disconnect();
        console.log("🔌 Socket disconnected on cleanup");
      }
    };
  }, [loginUserId]); // Added loginUserId as dependency

  // Join room when chat is selected
  useEffect(() => {
    if (selectedChat && socketRef.current && isConnected) {
      const roomId = selectedChat.chatId.roomId;
      console.log("🏠 Setting roomId:", roomId, "from selectedChat:", selectedChat);
      setRoomId(roomId);
      
      if (roomId) {
        console.log(`🏠 Joining room: ${roomId}`);
        socketRef.current.emit("join_room", { roomId });

        // Mark messages as read when entering chat
        setTimeout(() => {
          socketRef.current.emit("mark_messages_read", { roomId });
        }, 500);
      }
    }
  }, [selectedChat, isConnected]);

  // Leave previous room when switching chats
  useEffect(() => {
    return () => {
      if (roomId && socketRef.current) {
        console.log(`🚪 Leaving room: ${roomId}`);
        socketRef.current.emit("leave_room", { roomId });
      }
    };
  }, [roomId]);

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
      setReceiverId(userOne.userId);
      setReceiverName(userOne.userName);
      setReceiverEmail(userOne.userEmail);
    }
  }, [userOne]);

  useEffect(() => {
    if (selectedChat) {
      setChatId(selectedChat.chatId._id);
    }
  }, [selectedChat]);

  // Fetch messages for selected chat
  const { data: messagesData } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => gettAllMessagesByChatId(chatId),
    enabled: !!chatId,
  });

  useEffect(() => {
    if (messagesData) {
      console.log("messages Data ", messagesData.data.messages);
      setAllMessages(messagesData.data.messages);
    }
  }, [messagesData]);

  useEffect(() => {
    if (messagesData && userOne) {
      // set sender and receiver details
      const senderUserId =
        messagesData.data.messages[0]?.chatId.participants.find(
          (id) => id !== userOne.userId
        );
      console.log("senderUserId : ", senderUserId);
      setSenderId(senderUserId);
      messagesData.data.messages.forEach((message) => {
        if (message.sender._id === senderUserId) {
          setSenderName(message.sender.name);
          setSenderEmail(message.sender.email);
        }
      });
    }
  }, [messagesData, userOne]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Handle typing indicators
  const handleInputChange = (e) => {
    const value = e.target.value;
    
    if (value && !isTyping && socketRef.current && roomId) {
      setIsTyping(true);
      socketRef.current.emit("typing_start", { roomId });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && socketRef.current && roomId) {
        setIsTyping(false);
        socketRef.current.emit("typing_stop", { roomId });
      }
    }, 2000);
  };

  // post method to send a message (fallback)
  const mutation = useMutation({
    mutationKey: ["sendMessage"],
    mutationFn: createAMessage,
    onSuccess: (res) => {
      console.log("res from post method (send a message)", res);
      queryClient.invalidateQueries(["messages", chatId]);
      reset();
    },
    onError: (err) => {
      console.log(" Error in sending message", err);
      toast.error("Failed to send message");
    },
  });

  // React hook form for input text area for send message
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  // Watch for input changes to handle typing indicators
  const messageValue = watch("message", "");
  useEffect(() => {
    handleInputChange({ target: { value: messageValue } });
  }, [messageValue]);

  const onSubmit = (data) => {
    console.log("📤 Submitting message:", data);
    console.log("🔍 Current state - isConnected:", isConnected, "roomId:", roomId, "socket:", !!socketRef.current);
    
    // Use Socket.io to send message if connected, otherwise use HTTP
    if (socketRef.current && isConnected && roomId) {
      console.log("📤 Sending message via Socket.io to room:", roomId);
      socketRef.current.emit("send_message", { 
        roomId, 
        text: data.message.trim() 
      });
      reset();
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socketRef.current.emit("typing_stop", { roomId });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    } else {
      console.log("📤 Sending message via HTTP (fallback) - chatId:", chatId);
      if (!chatId) {
        toast.error("No chat selected");
        return;
      }
      mutation.mutate({ chatId, text: data.message });
    }
  };

  // Helper function to format typing users
  const getTypingUsersText = () => {
    const typingUsers = Array.from(usersTyping.values());
    
    if (typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      const user = typingUsers[0];
      return `${user.userName || user.userEmail} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName || typingUsers[0].userEmail} and ${typingUsers[1].userName || typingUsers[1].userEmail} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
      <Circle 
        className={`w-2 h-2 fill-current ${
          isConnected ? 'text-green-500' : 'text-red-500'
        }`} 
      />
      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      {usersTyping.size > 0 && (
        <span className="text-blue-500 italic">
          {getTypingUsersText()}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      {/* Connection Status */}
      <div className="px-4 pt-2">
        <ConnectionStatus />
      </div>

      {/* Messages Container - Takes up remaining space and is scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.map((chat, index) => (
          <div key={chat._id || index}>
            {chat.sender._id === senderId ? (
              <div className="chat chat-start">
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold relative">
                      {senderName.charAt(0).toUpperCase() || ""}
                      {onlineUsers.has(senderId) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="chat-header text-gray-700 flex items-center">
                  <span className="font-semibold text-sm">{senderName}</span>
                  <time className="text-xs ml-2 text-gray-500">
                    {formatTime(chat.createdAt)}
                  </time>
                </div>
                <div className="chat-bubble bg-sky-600 text-white border border-gray-200 shadow-sm">
                  {chat.text}
                </div>
                <div className="chat-footer">
                  <span className="text-xs text-gray-500">{senderEmail}</span>
                </div>
              </div>
            ) : (
              <div className="chat chat-end">
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold relative">
                      {receiverName.charAt(0).toUpperCase() || ""}
                      {onlineUsers.has(receiverId) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="chat-header text-gray-700 flex items-center">
                  <span className="font-semibold text-sm">{receiverName}</span>
                  <time className="text-xs ml-2 text-gray-500">
                    {formatTime(chat.createdAt)}
                  </time>
                </div>
                <div className="chat-bubble bg-sky-800/90 text-white">
                  {chat.text}
                </div>
                <div className="chat-footer">
                  <span className="text-xs text-gray-500">{receiverEmail}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Message Input Form at Bottom */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center space-x-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Type your message..."
              {...register("message")}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-500"
              disabled={mutation.isPending || !isConnected}
            />
            {errors.message && (
              <p className="text-red-500 text-xs mt-1 ml-4">{errors.message.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={mutation.isPending || !isConnected}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md disabled:cursor-not-allowed"
          >
            {mutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      <ToastContainer />
    </div>
  );
};

export default ChatWindow;