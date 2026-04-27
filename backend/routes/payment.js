const express = require('express');
const router = express.Router();
const { paymeWebhook, clickWebhook, getPremiumStatus } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/payme', paymeWebhook);
router.post('/click', clickWebhook);
router.get('/status', protect, getPremiumStatus);

module.exports = router;