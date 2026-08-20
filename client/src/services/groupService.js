import api from './api';

export const groupService = {
  createGroup: (payload) => api.post('/groups', payload).then((r) => r.data.data.conversation),
  updateGroup: (id, payload) => api.put(`/groups/${id}`, payload).then((r) => r.data.data.conversation),
  addMembers: (id, memberIds) =>
    api.post(`/groups/${id}/members`, { memberIds }).then((r) => r.data.data.conversation),
  removeMember: (id, userId) =>
    api.delete(`/groups/${id}/members/${userId}`).then((r) => r.data.data.conversation),
  leaveGroup: (id) => api.post(`/groups/${id}/leave`).then((r) => r.data),
};
