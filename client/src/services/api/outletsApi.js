import { request } from "../httpClient";
import { queryString } from "./helpers";
export const outletsApi = {
  queueChange:(id,body)=>request(`/outlets/${id}/change-queue`,{method:'POST',body:JSON.stringify(body)}),
  changeQueue:id=>request(`/outlets/${id}/change-queue`),
  cancelChange:(id,jobId,reason)=>request(`/outlets/${id}/change-queue/${jobId}/cancel`,{method:'POST',body:JSON.stringify({reason})}),
  directory:params=>request(`/outlets/directory?${queryString(params)}`),
  profile:id=>request(`/outlets/${id}/profile`),
  duplicates:body=>request('/outlets/duplicates',{method:'POST',body:JSON.stringify(body)}),
  reactivate:(id,body)=>request(`/outlets/${id}/reactivate`,{method:'POST',body:JSON.stringify(body)}),
  getAll: async (params = {}) => {
    const query = queryString(params);
    return await request(`/outlets${query ? `?${query}` : ''}`);
  },
  create: async outletData => {
    return await request('/outlets', {
      method: 'POST',
      body: JSON.stringify(outletData)
    });
  },
  update: async (id, outletData) => {
    return await request(`/outlets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(outletData)
    });
  },
  remove: async (id,body) => {
    return await request(`/outlets/${id}`, {
      method: 'DELETE',body:JSON.stringify(body)
    });
  },
  requestUnlock: async (outletId, reason, kind) => {
    return await request(`/outlets/${outletId}/unlock-request`, {
      method: 'POST',
      body: JSON.stringify({
        reason,kind
      })
    });
  },
  getUnlockRequests: async (params = {}) => {
    const query = queryString(params);
    return await request(`/outlets/unlock-requests${query ? `?${query}` : ''}`);
  },
  handleUnlockRequest: async (requestId, approved) => {
    return await request(`/outlets/unlock-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        approved
      })
    });
  }
};
