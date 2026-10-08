import { request } from '../httpClient';
export const notificationsApi = {
  getAll: (page = 1) => request(`/notifications?page=${page}`),
  read: id => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
  readAll: () => request('/notifications/read-all', { method: 'PATCH' }),
};
