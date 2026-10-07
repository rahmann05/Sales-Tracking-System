import { request } from "../httpClient";
import { queryString } from "./helpers";
export const reportsApi = {
  getWeekly: async (params = {}) => {
    const cleanParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
        cleanParams[k] = v;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return await request(`/reports/weekly${query ? `?${query}` : ''}`);
  },
  getMtd: async (params = {}) => {
    const cleanParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
        cleanParams[k] = v;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return await request(`/reports/mtd${query ? `?${query}` : ''}`);
  },
  getDashboard: async (params = {}) => {
    const query = queryString(params);
    return await request(`/reports/dashboard${query ? `?${query}` : ''}`);
  }
};
