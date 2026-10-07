import { request } from "../httpClient";
export const teamsApi = {
  getAll: () => request('/teams'),
  assign: (id, body) => request(`/teams/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
};
