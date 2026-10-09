import { request } from "../httpClient";
import { queryString } from "./helpers";
export const ordersApi = {
  getReviewAssignment:id=>request(`/orders/${id}/review-assignment`),
  saveReviewAssignment:(id,data)=>request(`/orders/${id}/review-assignment`,{method:'PUT',body:JSON.stringify(data)}),
  findRequest:requestId=>request(`/orders/requests/${requestId}`),
  cancelRemainder:(id,data)=>request(`/orders/${id}/cancel-remainder`,{method:'PATCH',body:JSON.stringify(data)}),
  createOrder: async ({
    code,requestId,expectedTotal,expectedTermDays,priceOverrideReason,
    pjpStopId,
    items,
    paymentType
  }) => {
    return await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        code,requestId,expectedTotal,expectedTermDays,priceOverrideReason,
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
  approveOrder: async (id,options={}) => {
    return await request(`/orders/${id}/approve`, {
      method: 'PATCH',body:JSON.stringify(options)
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
  rejectOrder: async (id, reason,options={}) => {
    return await request(`/orders/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...options,reason
      })
    });
  }
};
