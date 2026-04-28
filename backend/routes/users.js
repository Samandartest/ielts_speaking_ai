const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  setUserPremium,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.get('/', protect, adminOnly, getAllUsers);
router.put('/:userId/role', protect, adminOnly, updateUserRole);
router.delete('/:userId', protect, adminOnly, deleteUser);
router.put('/:userId/premium', protect, adminOnly, setUserPremium);

module.exports = router;