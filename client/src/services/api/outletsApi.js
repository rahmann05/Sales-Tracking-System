import { request } from "../httpClient";
import { queryString } from "./helpers";
export const outletsApi = {
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
  remove: async id => {
    return await request(`/outlets/${id}`, {
      method: 'DELETE'
    });
  },
  requestUnlock: async (outletId, reason) => {
    return await request(`/outlets/${outletId}/unlock-request`, {
      method: 'POST',
      body: JSON.stringify({
        reason
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
