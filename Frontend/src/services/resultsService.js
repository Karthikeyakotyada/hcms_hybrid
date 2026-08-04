import api from './api';

export const resultsService = {
  getResults: async (search = '', department = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    const response = await api.get(`/results?${params.toString()}`);
    return response.data;
  },

  getWinners: async () => {
    const response = await api.get('/winners');
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};
