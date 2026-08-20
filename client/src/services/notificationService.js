import api from './api';

export const notificationService = {
  getNotifications: () => api.get('/notifications').then((r) => r.data.data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data.data.notification),
  markAllAsRead: () => api.put('/notifications/read-all').then((r) => r.data),
};
