import { request } from "../httpClient";
export const outletValidationApi = {
  assign:(outletId,id,body)=>request(`/outlets/${outletId}/reviews/${id}/assignment`,{method:'PATCH',body:JSON.stringify(body)}),
  review:id=>request(`/outlets/reviews/${id}`),
  reviews:params=>request(`/outlets/reviews?${new URLSearchParams(params)}`),
  openReview:(id,body)=>request(`/outlets/${id}/reviews`,{method:'POST',body:JSON.stringify(body)}),
  decide:(id,reviewId,body)=>request(`/outlets/${id}/reviews/${reviewId}`,{method:'PATCH',body:JSON.stringify(body)}),
  correctCoordinates: (id, body) => request(`/outlets/${id}/coordinates`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  }),
  validateSingle: async (outletId,body) => {
    return await request(`/outlets/${outletId}/validate`, {
      method: 'POST',body:JSON.stringify(body)
    });
  },
  validateBatch: async (body) => {
    return await request('/outlets/batch-validate', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  validateNearby: async outletId => {
    return await request(`/outlets/${outletId}/validate-nearby`, {
      method: 'POST'
    });
  },
  getSummary: async () => {
    return await request('/outlets/validation-summary');
  }
};
