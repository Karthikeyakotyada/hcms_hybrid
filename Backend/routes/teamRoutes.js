const express = require('express');
const router = express.Router();
const {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  bulkImportTeams,
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { checkEvaluationLock } = require('../middleware/lockMiddleware');

router.get('/', protect, getTeams);
router.get('/:id', protect, getTeamById);
router.post('/', protect, checkEvaluationLock, createTeam);
router.put('/:id', protect, checkEvaluationLock, updateTeam);
router.delete('/:id', protect, checkEvaluationLock, deleteTeam);
router.post('/bulk-import', protect, checkEvaluationLock, bulkImportTeams);

module.exports = router;
