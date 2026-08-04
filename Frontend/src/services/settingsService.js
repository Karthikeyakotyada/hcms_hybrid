import api from './api';

export const settingsService = {
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (settingsData) => {
    const response = await api.put('/settings', settingsData);
    return response.data;
  },

  resetEvaluation: async () => {
    const response = await api.post('/settings/reset');
    return response.data;
  },

  getActivityLogs: async (page = 1, limit = 20) => {
    const response = await api.get(`/activity-logs?page=${page}&limit=${limit}`);
    return response.data;
  },
};
