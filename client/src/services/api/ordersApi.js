import { request } from "../httpClient";
import { queryString } from "./helpers";
export const ordersApi = {
  createOrder: async ({
    pjpStopId,
    items,
    paymentType
  }) => {
    return await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        pjpStopId,
        items,
        paymentType
      })
    });
  },
  getAllOrders: async (params = {}) => {
    const query = queryString(params);
    return await request(`/orders${query ? `?${query}` : ''}`);
  },
  approveOrder: async id => {
    return await request(`/orders/${id}/approve`, {
      method: 'PATCH'
    });
  },
  batchApproveOrders: async orderIds => {
    return await request('/orders/batch-approve', {
      method: 'PATCH',
      body: JSON.stringify({
        orderIds
      })
    });
  },
  rejectOrder: async (id, reason) => {
    return await request(`/orders/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({
        reason
      })
    });
  }
};
