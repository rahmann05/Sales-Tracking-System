import { request, saveSession, clearSession } from "../httpClient";
export const authApi = {
  me: () => request('/auth/me'),
  login: async (email, password = 'password123') => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      })
    });
    saveSession(res.data);
    return res.data;
  },
  logout: async () => {
    try{await request('/auth/logout',{method:'POST'});}catch(error){if(error.status!==401)throw error;}
    clearSession();
  },
  getStoredUser: () => {
    try {
      return JSON.parse(localStorage.getItem('authUser') || 'null');
    } catch {
      return null;
    }
  }
};
