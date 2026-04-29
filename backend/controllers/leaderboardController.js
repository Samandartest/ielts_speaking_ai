const Session = require('../models/Session');
const User = require('../models/User');

const getLeaderboard = async (req, res) => {
  try {
    const { type } = req.params;

    const now = new Date();
    let startDate;

    if (type === 'daily') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    const nonAdminUsers = await User.find({ role: 'user' }).select('_id');
    const nonAdminIds = nonAdminUsers.map((u) => u._id);

    const result = await Session.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          user: { $in: nonAdminIds },
        },
      },
      {
        $group: {
          _id: '$user',
          totalXp: { $sum: '$xpEarned' },
          sessionCount: { $sum: 1 },
          avgScore: { $avg: '$averageScore' },
        },
      },
      { $sort: { totalXp: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          totalXp: 1,
          sessionCount: 1,
          avgScore: { $round: ['$avgScore', 1] },
          name: '$userInfo.name',
          level: '$userInfo.level',
        },
      },
    ]);

    res.json({ type, startDate, leaderboard: result });
  } catch (error) {
    console.error('Leaderboard xatosi:', error);
    res.status(500).json({ message: 'Leaderboard olishda xatolik' });
  }
};

const getMyLimitStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Premium muddati tekshirish
    if (user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
      user.isPremium = false;
      user.premiumExpiresAt = null;
      await user.save();
    }

    const VOCAB_LIMIT = parseInt(process.env.DAILY_LIMIT_VOCAB) || 7;
    const SPEAKING_LIMIT = parseInt(process.env.DAILY_LIMIT_SPEAKING) || 9;

    // Premium user — unlimited, faqat tugash sanasini ko'rsatamiz
    if (user.isPremium) {
      return res.json({
        isPremium: true,
        premiumExpiresAt: user.premiumExpiresAt,
        daysLeft: user.premiumExpiresAt
          ? Math.ceil((user.premiumExpiresAt - new Date()) / (1000 * 60 * 60 * 24))
          : null,
        vocabulary: {
          used: 0,
          limit: null,
          remaining: null,
          unlimited: true,
        },
        speaking: {
          used: 0,
          limit: null,
          remaining: null,
          unlimited: true,
        },
        mockExam: {
          unlimited: true,
        },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = user.dailyUsage?.date
      ? new Date(user.dailyUsage.date)
      : null;

    const isToday = lastDate && lastDate >= today;

    // Mock exam haftalik limit
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const lastWeekStart = user.mockExamUsage?.weekStart ? new Date(user.mockExamUsage.weekStart) : null;
    const isSameWeek = lastWeekStart && lastWeekStart >= weekStart;
    const mockUsedThisWeek = isSameWeek ? (user.mockExamUsage.count || 0) : 0;
    const nextMonday = new Date(weekStart);
    nextMonday.setDate(weekStart.getDate() + 7);

    res.json({
      isPremium: false,
      vocabulary: {
        used: isToday ? user.dailyUsage.vocabularyCount : 0,
        limit: VOCAB_LIMIT,
        remaining: isToday ? Math.max(0, VOCAB_LIMIT - user.dailyUsage.vocabularyCount) : VOCAB_LIMIT,
        unlimited: false,
      },
      speaking: {
        used: isToday ? user.dailyUsage.speakingCount : 0,
        limit: SPEAKING_LIMIT,
        remaining: isToday ? Math.max(0, SPEAKING_LIMIT - user.dailyUsage.speakingCount) : SPEAKING_LIMIT,
        unlimited: false,
      },
      mockExam: {
        usedThisWeek: mockUsedThisWeek,
        limit: 1,
        canTake: mockUsedThisWeek < 1,
        resetsAt: nextMonday.toLocaleDateString('uz-UZ'),
        unlimited: false,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Limit statusini olishda xatolik' });
  }
};

module.exports = { getLeaderboard, getMyLimitStatus };
