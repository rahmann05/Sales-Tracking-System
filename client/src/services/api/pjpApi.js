import { request } from "../httpClient";
import { queryString } from "./helpers";
export const pjpApi = {
  generate: codes => request('/pjp/generate', {
    method: 'POST',
    body: JSON.stringify({
      codes
    })
  }),
  getTemplates: () => request('/pjp/templates'),
  saveTemplates: templates => request('/pjp/templates', {
    method: 'PUT',
    body: JSON.stringify({
      templates
    })
  }),
  getTodayPjp: async () => {
    return await request('/pjp/today');
  },
  getAllPjps: async (params = {}) => {
    const query = queryString(params);
    return await request(`/pjp${query ? `?${query}` : ''}`);
  }
};
