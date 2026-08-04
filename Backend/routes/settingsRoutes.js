const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  resetEvaluation,
  getActivityLogs,
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { checkEvaluationLock } = require('../middleware/lockMiddleware');

router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);
router.post('/settings/reset', protect, checkEvaluationLock, resetEvaluation);
router.get('/activity-logs', protect, getActivityLogs);

module.exports = router;
