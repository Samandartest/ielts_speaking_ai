const User = require('../models/User');
const crypto = require('crypto');

const PAYME_KEY = process.env.PAYME_KEY;
const CLICK_SECRET = process.env.CLICK_SECRET;
const PREMIUM_PRICE_UZS = 49900; // 49 900 so'm/oy
const PREMIUM_DAYS = 30;

// ─── Payme webhook ────────────────────────────────────────────────────────────
const paymeWebhook = async (req, res) => {
  try {
    const { method, params } = req.body;

    // Payme Basic Auth tekshirish
    const authHeader = req.headers.authorization || '';
    const base64 = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    if (!decoded.includes(PAYME_KEY)) {
      return res.json({ error: { code: -32504, message: 'Ruxsat yo\'q' } });
    }

    if (method === 'CheckPerformTransaction') {
      const { account } = params;
      const user = await User.findById(account.user_id);
      if (!user) return res.json({ error: { code: -31050, message: 'User topilmadi' } });
      return res.json({ result: { allow: true } });
    }

    if (method === 'PerformTransaction') {
      const { account, amount } = params;
      const user = await User.findById(account.user_id);
      if (!user) return res.json({ error: { code: -31050, message: 'User topilmadi' } });

      user.isPremium = true;
      user.premiumExpiresAt = new Date(Date.now() + PREMIUM_DAYS * 24 * 60 * 60 * 1000);
      await user.save();

      console.log(`[Premium] User ${user.email} premium activated via Payme`);
      return res.json({ result: { transaction: params.id, perform_time: Date.now(), state: 2 } });
    }

    res.json({ result: {} });
  } catch (error) {
    res.status(500).json({ error: { code: -32400, message: 'Server xatosi' } });
  }
};

// ─── Click webhook ─────────────────────────────────────────────────────────
const clickWebhook = async (req, res) => {
  try {
    const { click_trans_id, service_id, merchant_trans_id, amount, action, sign_time, sign_string } = req.body;

    // Sign tekshirish
    const signStr = `${click_trans_id}${service_id}${CLICK_SECRET}${merchant_trans_id}${amount}${action}${sign_time}`;
    const expectedSign = crypto.createHash('md5').update(signStr).digest('hex');

    if (sign_string !== expectedSign) {
      return res.json({ error: -1, error_note: 'Sign xato' });
    }

    if (action === '1') { // To'lov yakunlandi
      const user = await User.findById(merchant_trans_id);
      if (!user) return res.json({ error: -5, error_note: 'User topilmadi' });

      user.isPremium = true;
      user.premiumExpiresAt = new Date(Date.now() + PREMIUM_DAYS * 24 * 60 * 60 * 1000);
      await user.save();

      console.log(`[Premium] User ${user.email} premium activated via Click`);
    }

    res.json({ error: 0, error_note: 'Success' });
  } catch (error) {
    res.status(500).json({ error: -9, error_note: 'Server xatosi' });
  }
};

// ─── Premium status ────────────────────────────────────────────────────────
const getPremiumStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isActive = user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());
    res.json({
      isPremium: isActive,
      expiresAt: user.premiumExpiresAt,
      daysLeft: isActive && user.premiumExpiresAt
        ? Math.ceil((user.premiumExpiresAt - new Date()) / (1000 * 60 * 60 * 24))
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik' });
  }
};

module.exports = { paymeWebhook, clickWebhook, getPremiumStatus };