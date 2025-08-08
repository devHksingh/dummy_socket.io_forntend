import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loginSuccess } from "../features/user/userSlice";
import { useNavigate } from "react-router";
import { Search, Plus, X, User, LogOut, MessageSquare } from "lucide-react";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast, ToastContainer } from "react-toastify";
import { useForm } from "react-hook-form";
import { QueryClient, useMutation,useQueryClient  } from "@tanstack/react-query";

const formSchema = z.object({
  text: z.string().min(1, "User name or email is required"),
});

const searchUser = async (data) => {
  const token = sessionStorage.getItem("token");
  console.log("token in header: ", token);

  console.log("api call for search users data: ", data);
  console.log(
    "`https://dummy-socket-io-jnra.onrender.com/api/v1/users/${data.text}` ",
    `https://dummy-socket-io-jnra.onrender.com/api/v1/users/${data.text}`
  );
  const res = await axios.post(
    `https://dummy-socket-io-jnra.onrender.com/api/v1/users/${data.text}`,
    {}, // empty body
    {
      headers: {
        Authorization: `${token}`,
      },
    }
  );
  return res;
};

const createChatRoom = async (data) => {
  console.log("axios createChatRoom function data------", data);
  console.log(
    `-------------https://dummy-socket-io-jnra.onrender.com/api/v1/chats/${data}----------`,
    data
  );
  const token = sessionStorage.getItem("token");
  console.log("token in header: ", token);
  const res = await axios.post(
    `https://dummy-socket-io-jnra.onrender.com/api/v1/chats/`,
    {
      anotherUserEmail: data,
    },
    {
      headers: {
        Authorization: `${token}`,
      },
    }
  );
  return res;
};

const Header = () => {
  const [isUserStateUpdate, setIsUserStateUpdate] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userSearchResult, setUserSearchResult] = useState();
  const [selectedUser, setSelectedUser] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userOne = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  // isAdmin,isAuthenticated,token,userId,userName
  useEffect(() => {
    if (!userOne.token) {
      console.log("UserOne data", userOne);
      const token = sessionStorage.getItem("token");
      if (token) {
        const userSessionData = {
          token,
          userEmail: sessionStorage.getItem("userEmail"),
          userId: sessionStorage.getItem("userId"),
          userName: sessionStorage.getItem("userName"),
        };
        dispatch(loginSuccess(userSessionData));
        setIsUserStateUpdate(true);
      } else {
        navigate("/auth/login");
      }
    }
  }, [dispatch, navigate, userOne.token]);

  useEffect(() => {
    if (isUserStateUpdate) {
      console.log("update user data", userOne);
    }
  }, [isUserStateUpdate]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const mutation = useMutation({
    mutationFn: searchUser,
    onSuccess: (response) => {
      console.log("on login response", response.data);
      console.log("on login response", response.data.users);
      setUserSearchResult(response.data.users);
      const searchResults = response.data.users;
      const filterUser = searchResults.filter(
        (user) => user._id !== userOne.userId
      );
      console.log("filterUser", filterUser);
      setFilteredUsers(filterUser);
    },
    onError: (err) => {
      console.log("mutation Error", err);
      const errorMeassge =
        err.response?.data.message || "Something went wrong.Try it again!";

      // toast
      toast.error(errorMeassge, { position: "top-right" });
    },
  });

  const createChatMutation = useMutation({
    mutationKey: ["createUserChat"],
    mutationFn: createChatRoom,
    onSuccess: async(response) => {
      console.log("createChatRoom response ", response);
      // TODO: invalidate query for all user chat and refetch all user chat
      await queryClient.invalidateQueries({
        queryKey: ["getAllChatRooms"],
      });
      toast.success("Chat room created successfully!");
      setIsCreateModalOpen(false);
      reset();
    },
    onError: (err) => {
      console.log("ERROR ON createChatRoom  ", err);
      const errorMeassge =
        err.response?.data.message || "Something went wrong.Try it again!";
      reset();
      // toast
      toast.error(errorMeassge, { position: "top-right" });
    },
  });

  const onSubmit = (data) => {
    console.log(data);
    mutation.mutate(data);
  };
  const handleUserSelect = (user) => {
    console.log("selected user is :", user.email);

    setSelectedUser(user);

    // call mutation for createChatMutation
    // setIsCreateModalOpen(false);
    //  dispatch an action to set the selected user in the Redux store if needed
  };

  const handleCreateChat = () => {
    console.log("select user data : ", selectedUser.email);
    const anotherUserEmail = selectedUser.email;
    createChatMutation.mutate(anotherUserEmail);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section - Logo and title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Chat App</h1>
              <p className="text-sm text-gray-500">Real-time messaging</p>
            </div>
          </div>

          {/* Right section - User info and actions */}
          <div className="flex items-center space-x-4">
            {/* Create Chat Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>New Chat</span>
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {userOne?.userName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {userOne?.userName}
                </p>
                <p className="text-xs text-gray-500">{userOne?.userEmail}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              // onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Create Chat Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Chat
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  // setSearchQuery("");
                  // setSelectedUser(null);
                  // setIsSearching(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Search Input */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="relative mb-4">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    {...register("text")}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black placeholder:text-gray-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-2  hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors bg-sky-500 text-white absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    Search
                  </button>
                  {errors.text && (
                    <span className="text-sm font-medium text-red-600">
                      {errors.text.message}
                    </span>
                  )}
                </div>
              </form>
              {/* loding state */}
              {mutation.isPending && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500 mt-2">
                    Searching users...
                  </p>
                </div>
              )}
              {/* dispaly search result */}
              {filteredUsers &&
                filteredUsers.map((searchUser) => (
                  <div
                    key={searchUser._id}
                    onClick={() => handleUserSelect(searchUser)}
                    className={`${
                      selectedUser?._id === searchUser._id ? "bg-blue-200" : ""
                    } flex items-center space-x-3 p-3 hover:bg-blue-200 rounded-lg cursor-pointer transition-colors`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {searchUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {searchUser.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {searchUser.email}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  // setSearchQuery("");
                  // setSelectedUser(null);
                  // setIsSearching(false);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                // disabled={!selectedUser || createChatMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {createChatMutation.isPending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>
                  {createChatMutation.isPending ? "Creating..." : "Create Chat"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  );
};

export default Header;
