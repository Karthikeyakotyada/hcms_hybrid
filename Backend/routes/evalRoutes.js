const express = require('express');
const router = express.Router();
const {
  getScoresForRoundAndTeam,
  saveScoresForRoundAndTeam,
} = require('../controllers/evalController');
const { protect } = require('../middleware/authMiddleware');
const { checkEvaluationLock } = require('../middleware/lockMiddleware');

router.get('/round/:roundId/team/:teamId', protect, getScoresForRoundAndTeam);
router.post('/round/:roundId/team/:teamId', protect, checkEvaluationLock, saveScoresForRoundAndTeam);

module.exports = router;
