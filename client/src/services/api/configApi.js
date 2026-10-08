import { request } from "../httpClient";
export const configApi = {
  getHistory: (page=1) => request(`/config/history?page=${page}&limit=20`),
  getRuntime: async () => request('/config/runtime'),
  getAll: async () => request('/config'),
  getByKey: async key => request(`/config/${key}`),
  updateByKey: async (key, value) => request(`/config/${key}`, {
    method: 'PUT',
    body: JSON.stringify({
      value
    })
  }),
  bulkUpdate: async configs => request('/config', {
    method: 'PUT',
    body: JSON.stringify({
      configs
    })
  })
};
