const express = require('express');
const router = express.Router();
const {
  getRound1Scores,
  saveRound1Scores,
  getRound2Scores,
  saveRound2Scores,
} = require('../controllers/evalController');
const { protect } = require('../middleware/authMiddleware');
const { checkRound1Access, checkRound2Access } = require('../middleware/lockMiddleware');

router.get('/round1/:teamId', protect, getRound1Scores);
router.post('/round1/:teamId', protect, checkRound1Access, saveRound1Scores);

router.get('/round2/:teamId', protect, getRound2Scores);
router.post('/round2/:teamId', protect, checkRound2Access, saveRound2Scores);

module.exports = router;
