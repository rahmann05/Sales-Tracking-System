import { request } from "../httpClient";
import { queryString } from "./helpers";
export const usersApi = {
  getAll: async (params = {}) => {
    const query = queryString(params);
    return await request(`/users${query ? `?${query}` : ''}`);
  },
  getUsers: async (params = {}) => {
    return await usersApi.getAll(params);
  },
  getById: async id => {
    return await request(`/users/${id}`);
  },
  create: async userData => {
    return await request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  update: async (id, userData) => {
    return await request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData)
    });
  },
  remove: async id => {
    return await request(`/users/${id}`, {
      method: 'DELETE'
    });
  },
  updatePassword: async (id, password) => {
    return await request(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({
        password
      })
    });
  },
  updatePermissions: async (id, permissions) => {
    return await request(`/users/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({
        permissions
      })
    });
  },
  updateLocation: async coords => {
    return await request('/users/location', {
      method: 'POST',
      body: JSON.stringify(coords)
    });
  },
  getLiveLocations: async () => {
    return await request('/users/live-locations');
  }
};
