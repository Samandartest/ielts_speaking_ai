const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

router.post('/login', authLimiter, loginUser);
router.post('/register', otpLimiter, registerUser);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-email', verifyEmail);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);

// Target band yangilash
router.patch('/target-band', protect, async (req, res) => {
  try {
    const { targetBand } = req.body;
    const band = parseFloat(targetBand);
    if (!band || band < 1 || band > 9) {
      return res.status(400).json({ message: "Band 1-9 oralig'ida bo'lishi kerak" });
    }
    await User.findByIdAndUpdate(req.user._id, { targetBand: band });
    res.json({ message: 'Maqsad yangilandi', targetBand: band });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik' });
  }
});

module.exports = router;