import { request } from "../httpClient";
export const divisionsApi = {
  getAll: async ({
    includeInactive = false
  } = {}) => {
    const query = includeInactive ? '?includeInactive=true' : '';
    return await request(`/divisions${query}`);
  },
  create: async ({
    name,
    code
  }) => {
    return await request('/divisions', {
      method: 'POST',
      body: JSON.stringify({
        name,
        code
      })
    });
  },
  update: async (id, data) => {
    return await request(`/divisions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  delete: async id => {
    return await request(`/divisions/${id}`, {
      method: 'DELETE'
    });
  }
};
