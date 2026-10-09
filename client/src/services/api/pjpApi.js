import { request } from "../httpClient";
import { queryString } from "./helpers";
export const pjpApi = {
  dayStatus:params=>request(`/pjp/day-status?${queryString(params)}`),
  listPlans:()=>request('/pjp/planning'),
  getPlan:id=>request(`/pjp/planning/${id}`),
  previewPlan:data=>request('/pjp/planning/preview',{method:'POST',body:JSON.stringify(data)}),
  savePlan:(id,data)=>request(id?`/pjp/planning/${id}`:'/pjp/planning',{method:id?'PUT':'POST',body:JSON.stringify(data)}),
  publishPlan:(id,data)=>request(`/pjp/planning/${id}/publish`,{method:'POST',body:JSON.stringify(data)}),
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
