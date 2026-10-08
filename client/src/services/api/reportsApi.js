import { request } from "../httpClient";
import { queryString } from "./helpers";
export const reportsApi = {
  listArchives: params => request(`/reports/archives?${queryString(params)}`),
  getArchive: id => request(`/reports/archives/${encodeURIComponent(id)}`),
  createArchive: data => request('/reports/archives',{method:'POST',body:JSON.stringify(data)}),
  getCalendar: params => request(`/reports/calendar?${queryString(params)}`),
  saveCalendar: data => request('/reports/calendar',{method:'PUT',body:JSON.stringify(data)}),
  getTarget: params => request(`/reports/targets?${queryString(params)}`),
  saveTarget: data => request('/reports/targets',{method:'PUT',body:JSON.stringify(data)}),
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
