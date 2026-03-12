const express = require('express');
const router = express.Router();
const {
  getParts,
  getTopicsByPart,
  getQuestionsByTopic,
  seedData,
  addTopic,
  addQuestion,
  deleteTopicById,
  deleteQuestionById,
} = require('../controllers/speakingController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Oddiy userlar uchun
router.get('/parts', protect, getParts);
router.get('/topics/:partId', protect, getTopicsByPart);
router.get('/questions/:topicId', protect, getQuestionsByTopic);

// Faqat admin uchun
router.post('/seed', protect, adminOnly, seedData);
router.post('/add-topic', protect, adminOnly, addTopic);
router.post('/add-question', protect, adminOnly, addQuestion);
router.delete('/topic/:topicId', protect, adminOnly, deleteTopicById);
router.delete('/question/:questionId', protect, adminOnly, deleteQuestionById);

module.exports = router;