const express = require('express');
const router = express.Router();
const {
  scanAttendance,
  manualMarkAttendance,
  getAttendanceList,
  getAttendanceStats,
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getParticipantHistory,
  getTeamAttendance,
  getAllSessionsAttendanceReport,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

// All attendance routes are protected
router.use(protect);

// Scan and Manual Attendance
router.post('/scan', scanAttendance);
router.post('/mark', manualMarkAttendance);

// Attendance List and Aggregate Stats
router.get('/', getAttendanceList);
router.get('/stats', getAttendanceStats);
router.get('/export/all', getAllSessionsAttendanceReport);

// Session Management
router.get('/sessions', getSessions);
router.post('/sessions', createSession);
router.put('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);

// Participant History & Team Breakdown
router.get('/participant/:memberId', getParticipantHistory);
router.get('/team/:teamId', getTeamAttendance);

module.exports = router;
