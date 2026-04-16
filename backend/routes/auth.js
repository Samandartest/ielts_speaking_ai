const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

// Brute-force himoya
router.post('/login', authLimiter, loginUser);

// OTP spam himoya
router.post('/register', otpLimiter, registerUser);
router.post('/forgot-password', otpLimiter, forgotPassword);

// Oddiy
router.post('/verify-email', verifyEmail);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);

module.exports = router;