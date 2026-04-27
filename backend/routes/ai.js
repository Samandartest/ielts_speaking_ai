const express = require('express');
const router = express.Router();
const { getFeedback, saveSession, getSessionHistory, getProgress } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.get('/progress', protect, getProgress);
router.post('/feedback', protect, getFeedback);
router.post('/save-session', protect, saveSession);
router.get('/session-history', protect, getSessionHistory);

module.exports = router;
