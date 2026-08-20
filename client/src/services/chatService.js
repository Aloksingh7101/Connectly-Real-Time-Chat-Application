import api from './api';

export const chatService = {
  getConversations: () => api.get('/conversations').then((r) => r.data.data.conversations),
  createConversation: (participantId) =>
    api.post('/conversations', { participantId }).then((r) => r.data.data.conversation),
  getMessages: (conversationId, page = 1) =>
    api.get(`/messages/${conversationId}?page=${page}`).then((r) => r.data.data),
  sendMessage: (payload) => api.post('/messages', payload).then((r) => r.data.data.message),
  editMessage: (id, text) => api.put(`/messages/${id}`, { text }).then((r) => r.data.data.message),
  deleteMessage: (id, mode = 'me') =>
    api.delete(`/messages/${id}?mode=${mode}`).then((r) => r.data.data.message),
  searchUsers: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`).then((r) => r.data.data.users),
};
