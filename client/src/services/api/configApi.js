import { request } from "../httpClient";
export const configApi = {
  notificationDelivery:()=>request('/config/policies/notification-delivery'),
  retryNotificationDelivery:body=>request('/config/policies/notification-delivery/retry',{method:'POST',body:JSON.stringify(body)}),
  cancelSchedule:(scope,body)=>request('/config/policies/cancel-schedule',{method:'POST',body:JSON.stringify({scope,...body})}),
  policy: scope => request(`/config/policies?scope=${encodeURIComponent(scope)}`),
  policyOptions:()=>request('/config/policies/options'),
  simulate:body=>request('/config/policies/simulate',{method:'POST',body:JSON.stringify(body)}),
  saveDraft: (scope, body) => request(`/config/policies/draft?scope=${encodeURIComponent(scope)}`, {method:'PUT',body:JSON.stringify({...body,scope})}),
  preview: (scope, revision) => request(`/config/policies/preview?scope=${encodeURIComponent(scope)}`, {method:'POST',body:JSON.stringify({revision,scope})}),
  publish: (scope, body) => request(`/config/policies/publish?scope=${encodeURIComponent(scope)}`, {method:'POST',body:JSON.stringify({...body,scope})}),
  restore: (scope, body) => request(`/config/policies/restore?scope=${encodeURIComponent(scope)}`, {method:'POST',body:JSON.stringify({...body,scope})}),
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
