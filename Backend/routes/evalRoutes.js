const express = require('express');
const router = express.Router();
const {
  getScoresForRoundAndTeam,
  getScoresForRound,
  getAllEvaluationScores,
  saveScoresForRoundAndTeam,
} = require('../controllers/evalController');
const { protect } = require('../middleware/authMiddleware');
const { checkEvaluationLock } = require('../middleware/lockMiddleware');

router.get('/all-scores', protect, getAllEvaluationScores);
router.get('/round/:roundId/scores', protect, getScoresForRound);
router.get('/round/:roundId/team/:teamId', protect, getScoresForRoundAndTeam);
router.post('/round/:roundId/team/:teamId', protect, checkEvaluationLock, saveScoresForRoundAndTeam);

module.exports = router;
