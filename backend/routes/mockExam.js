const express = require('express');
const router = express.Router();
const { startMockExam, submitPart, getMockExamHistory } = require('../controllers/mockExamController');
const { protect } = require('../middleware/auth');
const { checkLimit } = require('../middleware/limitCheck');

router.post('/start', protect, checkLimit('speaking'), startMockExam);
router.post('/submit-part', protect, submitPart);
router.get('/history', protect, getMockExamHistory);

module.exports = router;