import { request } from "../httpClient";
export const dailyCallsApi = {
  getReport: async (params = {}) => {
    const cleanParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
        cleanParams[k] = v;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return await request(`/daily-calls${query ? `?${query}` : ''}`);
  }
};
