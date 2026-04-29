const User = require('../models/User');

// Admin paneldan o'zgartirilishi mumkin bo'lgan limitlar
const getDailyLimits = () => ({
  vocabulary: parseInt(process.env.DAILY_LIMIT_VOCAB) || 7,
  speaking: parseInt(process.env.DAILY_LIMIT_SPEAKING) || 9,
});

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const checkLimit = (type) => async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();

    const freshUser = await User.findById(req.user._id);

    // Premium muddati tugaganini tekshirish
    if (freshUser.isPremium && freshUser.premiumExpiresAt && freshUser.premiumExpiresAt < new Date()) {
      freshUser.isPremium = false;
      freshUser.premiumExpiresAt = null;
      await freshUser.save();
    }

    // Premium user — cheksiz
    if (freshUser.isPremium) return next();

    const today = getTodayStart();
    const lastDate = freshUser.dailyUsage?.date
      ? new Date(freshUser.dailyUsage.date)
      : null;

    const isToday = lastDate && new Date(lastDate).setHours(0,0,0,0) >= today.getTime();

    // Yangi kun — resetlash
    if (!isToday) {
      freshUser.dailyUsage = {
        date: new Date(),
        vocabularyCount: 0,
        speakingCount: 0,
      };
      await freshUser.save();
    }

    const DAILY_LIMITS = getDailyLimits();
    const countField = type === 'vocabulary' ? 'vocabularyCount' : 'speakingCount';
    const currentCount = isToday ? (freshUser.dailyUsage[countField] || 0) : 0;
    const limit = DAILY_LIMITS[type];

    if (currentCount >= limit) {
      return res.status(429).json({
        message: `Kunlik limit tugadi`,
        type,
        limit,
        used: currentCount,
        resetsAt: 'Ertaga 00:00',
      });
    }

    next();
  } catch (err) {
    console.error('Limit check xatosi:', err);
    res.status(500).json({ message: 'Limit tekshirishda xatolik' });
  }
};

const incrementLimit = async (userId, type) => {
  try {
    const today = getTodayStart();
    const user = await User.findById(userId);

    // Premium user uchun increment qilmaymiz
    if (user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())) {
      return;
    }

    const lastDate = user.dailyUsage?.date
      ? new Date(user.dailyUsage.date)
      : null;

    const isToday = lastDate && new Date(lastDate).setHours(0,0,0,0) >= today.getTime();

    const countField = type === 'vocabulary' ? 'vocabularyCount' : 'speakingCount';

    if (!isToday) {
      user.dailyUsage = {
        date: new Date(),
        vocabularyCount: type === 'vocabulary' ? 1 : 0,
        speakingCount: type === 'speaking' ? 1 : 0,
      };
    } else {
      user.dailyUsage[countField] = (user.dailyUsage[countField] || 0) + 1;
    }

    user.markModified('dailyUsage');
    await user.save();

    console.log(`[Limit] ${type} incremented for user ${userId}: ${user.dailyUsage[countField]}`);
  } catch (err) {
    console.error('incrementLimit xatosi:', err);
  }
};

// Mock exam — haftada 1 ta (faqat oddiy userlar)
const checkMockExamLimit = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();

    const user = await User.findById(req.user._id);

    // Premium muddati tugaganini tekshirish
    if (user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
      user.isPremium = false;
      user.premiumExpiresAt = null;
      await user.save();
    }

    // Premium — cheklanmaydi
    if (user.isPremium) return next();

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));

    const lastWeekStart = user.mockExamUsage?.weekStart
      ? new Date(user.mockExamUsage.weekStart)
      : null;

    const isSameWeek = lastWeekStart && lastWeekStart >= weekStart;

    if (isSameWeek && user.mockExamUsage.count >= 1) {
      const nextMonday = new Date(weekStart);
      nextMonday.setDate(weekStart.getDate() + 7);

      return res.status(429).json({
        message: 'Haftalik mock exam limiti tugadi',
        resetsAt: nextMonday.toLocaleDateString('uz-UZ'),
        type: 'mock_exam',
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: 'Limit tekshirishda xatolik' });
  }
};

const incrementMockExamLimit = async (userId) => {
  try {
    const user = await User.findById(userId);

    // Premium user uchun mock limit hisoblanmaydi
    if (user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())) {
      return;
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));

    const lastWeekStart = user.mockExamUsage?.weekStart
      ? new Date(user.mockExamUsage.weekStart)
      : null;

    const isSameWeek = lastWeekStart && lastWeekStart >= weekStart;

    if (!isSameWeek) {
      user.mockExamUsage = { weekStart, count: 1 };
    } else {
      user.mockExamUsage.count += 1;
    }

    user.markModified('mockExamUsage');
    await user.save();
    console.log(`[MockLimit] Mock exam count for user ${userId}: ${user.mockExamUsage.count}`);
  } catch (err) {
    console.error('incrementMockExamLimit xatosi:', err);
  }
};

module.exports = { checkLimit, incrementLimit, checkMockExamLimit, incrementMockExamLimit, getDailyLimits };
