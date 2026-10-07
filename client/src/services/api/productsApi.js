import { request } from "../httpClient";
import { queryString } from "./helpers";
export const productsApi = {
  getAll: async (params = {}) => {
    const query = queryString(params);
    return await request(`/products${query ? `?${query}` : ''}`);
  },
  getById: async id => {
    return await request(`/products/${id}`);
  },
  create: async data => {
    return await request('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update: async (id, data) => {
    return await request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  remove: async id => {
    return await request(`/products/${id}`, {
      method: 'DELETE'
    });
  }
};
