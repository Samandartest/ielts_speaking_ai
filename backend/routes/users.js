const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  setUserPremium,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.get('/', protect, admin, getAllUsers);
router.put('/:userId/role', protect, admin, updateUserRole);
router.delete('/:userId', protect, admin, deleteUser);
router.put('/:userId/premium', protect, admin, setUserPremium);

module.exports = router;