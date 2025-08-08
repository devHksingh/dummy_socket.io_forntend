import React, { useEffect, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  setUserAllChats,
  setActiveChatChatId,
} from "../features/chat/chatSlice";
//
/*
1.fetch all chat by user id by axois and react query
2.Show Chat Name with Latest last message
3. OnClick Chat Name (div) Show that full chat redux tollkit (state for current chat id)
4. Button having Create New Chat onclick open modal show for create chat Enter user name or email 
show list of user with name and email
5. OnClick User show that user in ChatShown component
 6. OnClick Create Chat Button create chat with user id and show in sidebar
 7. OnClick Chat Name show that chat in ChatShown component
*/
// const backendUrl =
//   import.meta.env.VITE_MODE === "development"
//     ? "https://dummy-socket-io-jnra.onrender.com/"
//     : import.meta.env.VITE_BACKEND_URL;
    const backendUrl = "https://dummy-socket-io-jnra.onrender.com/";
const fetchAllUserChat = async () => {
  const token = sessionStorage.getItem("token");
  console.log("token is", token);

  if (!token) throw new Error("No token found");
  const response = await axios.get(`${backendUrl}api/v1/chats/`, {
    headers: {
      Authorization: `${token}`,
    },
  });
  if (response.status !== 200) throw new Error("Failed to fetch chats");
  return response.data;
};

const SideBar = () => {
  const [userChats, setUsersChats] = useState([]);
  const dispatch = useDispatch();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["chatGroup"],
    queryFn: fetchAllUserChat,
  });
  useEffect(() => {
    if (data) {
      console.log("chat data is", data);
      setUsersChats(data.chats);
      dispatch(setUserAllChats({ userAllChats: data.chats }));
    }
  }, [data]);
  const handleActiveChat = (id) => {
    console.log("handleActiveChat id is :----",id);
    
    dispatch(setActiveChatChatId({ activeChatId: id }));
  };
  if (isLoading) {
    return <div>Chat is isLoading....</div>;
  }
  if (isError) {
    return <div>Chat is isError....{error.message}</div>;
  }

  return (
    <div className="w-1/4 p-2 bg-red-400 border-r  border-gray-200 flex flex-col ">
      <h1>Chats</h1>
      <div>
        {userChats.map((chat) => (
          <div key={chat._id} className="space-y-2 ">
            <button onClick={() => handleActiveChat(chat._id)} className="bg-sky-800 w-full rounded hover:bg-sky-400 px-2 py-1">
              {chat.isGroupChat ? (
                // group chat name with latest message
                <div className="flex flex-col gap-1 items-start">
                  <span>{chat.chatName}</span>
                  <span>Latest: {chat.latestMessage.content}</span>
                </div>
              ) : (
                // User Name with latest message
                <div className="flex flex-col gap-1 items-start">
                  <span>Name:{chat.users[0].name}</span>
                  <span>Latest: {chat.latestMessage.content}</span>
                </div>
              )}
            </button>
            <h2></h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SideBar;
