import api from './api';

export const evalService = {
  getRoundScores: async (roundId, teamId) => {
    const response = await api.get(`/evaluation/round/${roundId}/team/${teamId}`);
    return response.data;
  },

  saveRoundScores: async (roundId, teamId, data) => {
    const response = await api.post(`/evaluation/round/${roundId}/team/${teamId}`, data);
    return response.data;
  },

  // Legacy fallback helpers if needed anywhere
  getRound1Scores: async (teamId) => {
    const response = await api.get(`/evaluation/round1/${teamId}`);
    return response.data;
  },

  saveRound1Scores: async (teamId, data) => {
    const response = await api.post(`/evaluation/round1/${teamId}`, data);
    return response.data;
  },

  getRound2Scores: async (teamId) => {
    const response = await api.get(`/evaluation/round2/${teamId}`);
    return response.data;
  },

  saveRound2Scores: async (teamId, data) => {
    const response = await api.post(`/evaluation/round2/${teamId}`, data);
    return response.data;
  },
};
