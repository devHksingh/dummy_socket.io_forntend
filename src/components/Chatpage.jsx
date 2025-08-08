import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/Header';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import { chatAPI } from '../services/apiServices';
import {  addMessage } from '../features/message/messageSlice';
import {setChatRooms} from "../features/chat/chatSlice"
import socketService from '../services/SocketService';

const ChatPage = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { selectedChat } = useSelector((state) => state.chat);

  // Fetch all chat rooms
  const { data: chatRoomsData, isLoading } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatAPI.getAllChatRooms,
    enabled: !!token,
  });

  useEffect(() => {
    if (chatRoomsData?.data?.chatRooms) {
      dispatch(setChatRooms(chatRoomsData.data.chatRooms));
    }
  }, [chatRoomsData, dispatch]);

  // Initialize socket connection
  useEffect(() => {
    if (token) {
      const socket = socketService.connect(token);

      // Listen for incoming messages
      socketService.onReceiveMessage((message) => {
        dispatch(addMessage({
          chatId: message.chatId,
          message: message
        }));
      });

      return () => {
        socketService.offAllListeners();
      };
    }
  }, [token, dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar />
        <div className="flex-1">
          {selectedChat ? (
            <ChatWindow />
          ) : (
            <div className="flex items-center justify-center h-full bg-white">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  Welcome to Chat App
                </h2>
                <p className="text-gray-500">
                  Select a chat to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;