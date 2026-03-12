const express = require('express');
const router = express.Router();
const { getFeedback } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/feedback', protect, getFeedback);

module.exports = router;