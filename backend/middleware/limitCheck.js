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

module.exports = { checkLimit, incrementLimit };