import api from './api';

export const teamService = {
  getTeams: async (page = 1, limit = 10, search = '', department = '', minTeam = null, maxTeam = null) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    if (minTeam !== null && minTeam !== undefined && minTeam !== '') params.append('minTeam', minTeam);
    if (maxTeam !== null && maxTeam !== undefined && maxTeam !== '') params.append('maxTeam', maxTeam);
    const response = await api.get(`/teams?${params.toString()}`);
    return response.data;
  },

  getTeamById: async (id) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  createTeam: async (teamData) => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  updateTeam: async (id, teamData) => {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.data;
  },

  deleteTeam: async (id) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  bulkImport: async (teamsArray) => {
    const response = await api.post('/teams/bulk-import', { teams: teamsArray });
    return response.data;
  },
};
