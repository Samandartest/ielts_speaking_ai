const User = require('../models/User');

// Barcha userlarni olish
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
};

// User role ni o'zgartirish
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role faqat "user" yoki "admin" bo\'lishi mumkin' });
    }

    // O'zini o'zi o'zgartira olmasligi uchun
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'O\'zingizning role\'ingizni o\'zgartira olmaysiz' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User topilmadi' });
    }

    res.json({
      message: `${user.name} endi "${role}" bo'ldi!`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
};

// User o'chirish
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'O\'zingizni o\'chira olmaysiz' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User topilmadi' });
    }

    res.json({ message: `${user.name} o'chirildi!` });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
};

// User premium holatini boshqarish (admin)
const setUserPremium = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isPremium } = req.body;

    const updateData = { isPremium };
    if (isPremium) {
      updateData.premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 kun
    } else {
      updateData.premiumExpiresAt = null;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

    if (!user) return res.status(404).json({ message: 'User topilmadi' });

    res.json({
      message: `${user.name} ${isPremium ? 'Premium qilindi' : 'Premium bekor qilindi'}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

module.exports = { getAllUsers, updateUserRole, deleteUser, setUserPremium };