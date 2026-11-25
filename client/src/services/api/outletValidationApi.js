import { request } from '../httpClient';
import { queryString } from './helpers';
export const outletValidationApi = {
  digital: (outletId, id, body) =>
    request(`/outlets/${outletId}/reviews/${id}/digital`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  assignField: (outletId, id, body) =>
    request(`/outlets/${outletId}/reviews/${id}/field-task`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  fieldVisitReport: (query) => {
    const qs = queryString(query);
    return request(`/outlets/field-visit-report${qs ? `?${qs}` : ''}`);
  },
  fieldTask: (id) => request(`/outlets/field-tasks/${id}`),
  fieldTasks: (query = {}) => {
    const qs = queryString(typeof query === 'string' ? { status: query } : query);
    return request(`/outlets/field-tasks${qs ? `?${qs}` : ''}`);
  },
  fieldAction: (id, body) =>
    request(`/outlets/field-tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  jobs: () => request('/outlets/validation-jobs'),
  startJob: (body) =>
    request('/outlets/validation-jobs', { method: 'POST', body: JSON.stringify(body) }),
  jobAction: (id, body) =>
    request(`/outlets/validation-jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  assign: (outletId, id, body) =>
    request(`/outlets/${outletId}/reviews/${id}/assignment`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  review: (id) => request(`/outlets/reviews/${id}`),
  reviews: (params) => {
    const qs = queryString(params);
    return request(`/outlets/reviews${qs ? `?${qs}` : ''}`);
  },
  openReview: (id, body) =>
    request(`/outlets/${id}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  decide: (id, reviewId, body) =>
    request(`/outlets/${id}/reviews/${reviewId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  correctCoordinates: (id, body) =>
    request(`/outlets/${id}/coordinates`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  validateSingle: async (outletId, body) => {
    return await request(`/outlets/${outletId}/validate`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  validateBatch: async (body) => {
    return await request('/outlets/batch-validate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  validateNearby: async (outletId) => {
    return await request(`/outlets/${outletId}/validate-nearby`, {
      method: 'POST',
    });
  },
  getSummary: async () => {
    return await request('/outlets/validation-summary');
  },
};
