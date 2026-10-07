import { request } from "../httpClient";
export const outletValidationApi = {
  correctCoordinates: (id, body) => request(`/outlets/${id}/coordinates`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  }),
  validateSingle: async outletId => {
    return await request(`/outlets/${outletId}/validate`, {
      method: 'POST'
    });
  },
  validateBatch: async ({
    outletIds,
    filter,
    limit
  } = {}) => {
    return await request('/outlets/batch-validate', {
      method: 'POST',
      body: JSON.stringify({
        outletIds,
        filter,
        limit
      })
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
