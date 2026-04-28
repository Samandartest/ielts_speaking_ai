const User = require('../models/User');

const DAILY_LIMITS = {
  vocabulary: 7,
  speaking: 9,
};

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const checkLimit = (type) => async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();

      // Premium user limitsiz
    const freshUser = await User.findById(req.user._id);
    if (freshUser.isPremium) {
      // Premium muddati tugagan bo'lsa o'chirish
      if (freshUser.premiumExpiresAt && freshUser.premiumExpiresAt < new Date()) {
        freshUser.isPremium = false;
        freshUser.premiumExpiresAt = null;
        await freshUser.save();
      } else {
        return next();
      }
    }

    const today = getTodayStart();
    const user = await User.findById(req.user._id);

    const lastDate = user.dailyUsage?.date
      ? new Date(user.dailyUsage.date)
      : null;

    const isToday = lastDate && new Date(lastDate).setHours(0,0,0,0) >= today.getTime();

    // Yangi kun — resetlash
    if (!isToday) {
      user.dailyUsage = {
        date: new Date(),
        vocabularyCount: 0,
        speakingCount: 0,
      };
      await user.save();
    }

    const countField = type === 'vocabulary' ? 'vocabularyCount' : 'speakingCount';
    const currentCount = isToday ? (user.dailyUsage[countField] || 0) : 0;
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

    const lastDate = user.dailyUsage?.date
      ? new Date(user.dailyUsage.date)
      : null;

    const isToday = lastDate && new Date(lastDate).setHours(0,0,0,0) >= today.getTime();

    const countField = type === 'vocabulary' ? 'vocabularyCount' : 'speakingCount';

    if (!isToday) {
      // Yangi kun — reset qilib, 1 dan boshlaymiz
      user.dailyUsage = {
        date: new Date(),
        vocabularyCount: type === 'vocabulary' ? 1 : 0,
        speakingCount: type === 'speaking' ? 1 : 0,
      };
    } else {
      // Bugungi countni oshiramiz
      user.dailyUsage[countField] = (user.dailyUsage[countField] || 0) + 1;
      user.dailyUsage.date = user.dailyUsage.date; // unchanged
    }

    // markModified kerak — nested object o'zgarganda Mongoose sezmasligi mumkin
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

    // Premium — cheklanmaydi
    if (user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())) {
      return next();
    }

    const now = new Date();
    // Haftaning boshi (dushanba)
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));

    const lastWeekStart = user.mockExamUsage?.weekStart
      ? new Date(user.mockExamUsage.weekStart)
      : null;

    const isSameWeek = lastWeekStart && lastWeekStart >= weekStart;

    if (isSameWeek && user.mockExamUsage.count >= 1) {
      // Keyingi dushanbani hisoblash
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

module.exports = { checkLimit, incrementLimit, checkMockExamLimit, incrementMockExamLimit };