import api from './api';

// User API functions
export const userAPI = {
  searchUsers: (query) => api.post(`/users/${query}`),
};

// Chat API functions
export const chatAPI = {
  createChatRoom: (anotherUserEmail) => 
    api.post('/chats', { anotherUserEmail }),
  getAllChatRooms: () => api.get('/chats'),
};

// Message API functions
export const messageAPI = {
  createMessage: (chatId, text) => 
    api.post('/messages', { chatId, text }),
  getAllMessagesByChatId: (chatId) => 
    api.post('/messages/gettAllMessagesByChatId', { chatId }),
};

// findUserByNameOrEmail
export const searchUsersAPI = {
   searchUser : (data)=> api.post(`/users/${data}`)
  
}
