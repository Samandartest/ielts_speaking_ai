const express = require('express');
const router = express.Router();
const {
  getMockExamQuestions,
  startMockExam,
  submitPart,
  getMockExamHistory,
  cancelMockExam,
} = require('../controllers/mockExamController');
const { protect } = require('../middleware/auth');
const { checkMockExamLimit } = require('../middleware/limitCheck');

router.get('/questions', protect, getMockExamQuestions);
router.post('/start', protect, checkMockExamLimit, startMockExam);
router.post('/submit-part', protect, submitPart);
router.post('/cancel', protect, cancelMockExam);
router.get('/history', protect, getMockExamHistory);

module.exports = router;