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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = user.dailyUsage?.date
      ? new Date(user.dailyUsage.date)
      : null;

    const isToday = lastDate && lastDate >= today;

    res.json({
      vocabulary: {
        used: isToday ? user.dailyUsage.vocabularyCount : 0,
        limit: 7,
        remaining: isToday ? Math.max(0, 7 - user.dailyUsage.vocabularyCount) : 7,
      },
      speaking: {
        used: isToday ? user.dailyUsage.speakingCount : 0,
        limit: 9,
        remaining: isToday ? Math.max(0, 9 - user.dailyUsage.speakingCount) : 9,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Limit statusini olishda xatolik' });
  }
};

module.exports = { getLeaderboard, getMyLimitStatus };