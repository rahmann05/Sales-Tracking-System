import { request } from "../httpClient";
export const rolesApi = {
  getAll: async () => {
    return await request('/roles');
  },
  getByCode: async code => {
    return await request(`/roles/${code}`);
  },
  create: async data => {
    return await request('/roles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update: async (code, data) => {
    return await request(`/roles/${code}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  delete: async code => {
    return await request(`/roles/${code}`, {
      method: 'DELETE'
    });
  },
  getPermissions: async () => {
    return await request('/roles/permissions');
  }
};
