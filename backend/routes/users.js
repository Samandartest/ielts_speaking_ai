const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  setUserPremium,
  updateDailyLimits,
  getDailyLimits,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// MUHIM: /config/* routelari /:userId dan OLDIN bo'lishi kerak
// Aks holda Express "config" ni userId deb qabul qiladi
router.get('/config/limits', protect, adminOnly, getDailyLimits);
router.put('/config/limits', protect, adminOnly, updateDailyLimits);

router.get('/', protect, adminOnly, getAllUsers);
router.put('/:userId/role', protect, adminOnly, updateUserRole);
router.delete('/:userId', protect, adminOnly, deleteUser);
router.put('/:userId/premium', protect, adminOnly, setUserPremium);

module.exports = router;
