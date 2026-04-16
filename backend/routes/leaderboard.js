const express = require('express');
const router = express.Router();
const { getLeaderboard, getMyLimitStatus } = require('../controllers/leaderboardController');
const { protect } = require('../middleware/auth');

router.get('/me/limits', protect, getMyLimitStatus);
router.get('/:type', protect, getLeaderboard);

module.exports = router;