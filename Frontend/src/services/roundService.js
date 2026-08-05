import api from './api';

export const roundService = {
  getRounds: async () => {
    const response = await api.get('/rounds');
    return response.data;
  },

  createRound: async (roundData) => {
    const response = await api.post('/rounds', roundData);
    return response.data;
  },

  updateRound: async (id, roundData) => {
    const response = await api.put(`/rounds/${id}`, roundData);
    return response.data;
  },

  deleteRound: async (id) => {
    const response = await api.delete(`/rounds/${id}`);
    return response.data;
  },
};
