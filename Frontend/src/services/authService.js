import api from './api';

export const authService = {
  register: async ({ name, username, password, organization }) => {
    const response = await api.post('/auth/register', {
      name,
      username,
      password,
      organization,
    });
    if (response.data.token) {
      localStorage.setItem('hems_token', response.data.token);
      localStorage.setItem('hems_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('hems_token', response.data.token);
      localStorage.setItem('hems_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('hems_token');
      localStorage.removeItem('hems_user');
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('hems_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  fetchProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
