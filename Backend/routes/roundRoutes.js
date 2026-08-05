const express = require('express');
const router = express.Router();
const {
  getRounds,
  createRound,
  updateRound,
  deleteRound,
} = require('../controllers/roundController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getRounds)
  .post(protect, createRound);

router.route('/:id')
  .put(protect, updateRound)
  .delete(protect, deleteRound);

module.exports = router;
