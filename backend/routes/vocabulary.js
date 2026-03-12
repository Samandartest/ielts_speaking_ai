const express = require('express');
const router = express.Router();
const { getVocabulary } = require('../controllers/vocabularyController');
const { protect } = require('../middleware/auth');

router.post('/search', protect, getVocabulary);

module.exports = router;