const express = require('express');
const router = express.Router();
const { getResults, getWinners, getDashboardStats } = require('../controllers/resultsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/results', protect, getResults);
router.get('/winners', protect, getWinners);
router.get('/dashboard/stats', protect, getDashboardStats);

module.exports = router;
