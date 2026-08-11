import api from './api';

export const attendanceService = {
  // Process barcode/QR scan
  scanAttendance: async (registerNumber, sessionId = null) => {
    const response = await api.post('/attendance/scan', { registerNumber, sessionId });
    return response.data;
  },

  // Manual mark (PRESENT, ABSENT, or NOT_MARKED)
  manualMarkAttendance: async (memberId, sessionId, status) => {
    const response = await api.post('/attendance/mark', { memberId, sessionId, status });
    return response.data;
  },

  // Get paginated attendance list with filters
  getAttendanceList: async ({
    sessionId = '',
    status = 'ALL',
    method = 'ALL',
    search = '',
    department = '',
    page = 1,
    limit = 20,
  } = {}) => {
    const params = new URLSearchParams();
    if (sessionId) params.append('sessionId', sessionId);
    if (status && status !== 'ALL') params.append('status', status);
    if (method && method !== 'ALL') params.append('method', method);
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const response = await api.get(`/attendance?${params.toString()}`);
    return response.data;
  },

  // Get summary stats for active/selected session
  getAttendanceStats: async (sessionId = '') => {
    const url = sessionId ? `/attendance/stats?sessionId=${sessionId}` : '/attendance/stats';
    const response = await api.get(url);
    return response.data;
  },

  // Session management
  getSessions: async () => {
    const response = await api.get('/attendance/sessions');
    return response.data;
  },

  createSession: async (data) => {
    const response = await api.post('/attendance/sessions', data);
    return response.data;
  },

  updateSession: async (id, data) => {
    const response = await api.put(`/attendance/sessions/${id}`, data);
    return response.data;
  },

  deleteSession: async (id) => {
    const response = await api.delete(`/attendance/sessions/${id}`);
    return response.data;
  },

  // Participant attendance history across all sessions
  getParticipantHistory: async (memberId) => {
    const response = await api.get(`/attendance/participant/${memberId}`);
    return response.data;
  },

  // Team attendance breakdown
  getTeamAttendance: async (teamId, sessionId = '') => {
    const url = sessionId ? `/attendance/team/${teamId}?sessionId=${sessionId}` : `/attendance/team/${teamId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Master all-sessions attendance export matrix
  getAllSessionsReport: async () => {
    const response = await api.get('/attendance/export/all');
    return response.data;
  },
};
