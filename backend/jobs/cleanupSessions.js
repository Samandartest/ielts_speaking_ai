const cron = require('node-cron');
const Session = require('../models/Session');

const startCleanupJob = () => {
  // Har kuni soat 03:00 da ishlaydi
  cron.schedule('0 3 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Session.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
      });

      console.log(`[Cleanup] ${result.deletedCount} ta eski sessiya o'chirildi.`);
    } catch (err) {
      console.error('[Cleanup] Xatolik:', err.message);
    }
  });

  console.log('[Cleanup] Sessiya tozalash jobi ishga tushdi (har kuni 03:00)');
};

module.exports = { startCleanupJob };