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
// months: 1 = 30 kun, 3 = 90 kun, false/undefined = o'chirish
const setUserPremium = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isPremium, months } = req.body;

    const updateData = { isPremium };

    if (isPremium) {
      const durationMonths = months === 3 ? 3 : 1;
      const durationDays = durationMonths * 30;

      const existingUser = await User.findById(userId);
      if (!existingUser) return res.status(404).json({ message: 'User topilmadi' });

      // Agar premium allaqachon aktiv bo'lsa — muddatini uzaytirish
      const baseDate = (existingUser.isPremium && existingUser.premiumExpiresAt && existingUser.premiumExpiresAt > new Date())
        ? existingUser.premiumExpiresAt
        : new Date();

      updateData.premiumExpiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    } else {
      updateData.premiumExpiresAt = null;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User topilmadi' });

    res.json({
      message: `${user.name} ${isPremium ? `Premium qilindi (${months === 3 ? '3 oy' : '1 oy'})` : 'Premium bekor qilindi'}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Daily limitlarni yangilash (admin)
const updateDailyLimits = async (req, res) => {
  try {
    const { vocabulary, speaking } = req.body;

    if (vocabulary !== undefined && (typeof vocabulary !== 'number' || vocabulary < 1 || vocabulary > 100)) {
      return res.status(400).json({ message: 'Vocabulary limiti 1-100 oraligida bolishi kerak' });
    }
    if (speaking !== undefined && (typeof speaking !== 'number' || speaking < 1 || speaking > 100)) {
      return res.status(400).json({ message: 'Speaking limiti 1-100 oraligida bolishi kerak' });
    }

    if (vocabulary !== undefined) process.env.DAILY_LIMIT_VOCAB = String(vocabulary);
    if (speaking !== undefined) process.env.DAILY_LIMIT_SPEAKING = String(speaking);

    res.json({
      message: 'Limitlar yangilandi',
      limits: {
        vocabulary: parseInt(process.env.DAILY_LIMIT_VOCAB) || 7,
        speaking: parseInt(process.env.DAILY_LIMIT_SPEAKING) || 9,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Hozirgi limitlarni olish
const getDailyLimits = async (req, res) => {
  try {
    res.json({
      vocabulary: parseInt(process.env.DAILY_LIMIT_VOCAB) || 7,
      speaking: parseInt(process.env.DAILY_LIMIT_SPEAKING) || 9,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

module.exports = { getAllUsers, updateUserRole, deleteUser, setUserPremium, updateDailyLimits, getDailyLimits };
