const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendVerificationCode, sendPasswordResetCode } = require('../config/mailer');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── 1. Ro'yxatdan o'tish — kod yuborish ─────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Barcha maydonlarni to\'liq kiriting' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }

    const code = generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 daqiqa

    if (existingUser && !existingUser.isVerified) {
      // Avval ro'yxatdan o'tib, tasdiqlamagan — yangi kod yuboramiz
      existingUser.name = name;
      existingUser.password = password;
      existingUser.verificationCode = code;
      existingUser.verificationCodeExpires = expires;
      await existingUser.save();
    } else {
      // Yangi user yaratamiz (hali tasdiqlanmagan)
      await User.create({
        name,
        email,
        password,
        isVerified: false,
        verificationCode: code,
        verificationCodeExpires: expires,
      });
    }

    await sendVerificationCode(email, code);

    res.status(200).json({
      message: 'Tasdiqlash kodi emailingizga yuborildi',
      email,
    });
  } catch (error) {
    console.error('Register xatosi:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
};

// ─── 2. Email kodni tasdiqlash ────────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User topilmadi' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email allaqachon tasdiqlangan' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Kod noto\'g\'ri' });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Kod muddati tugagan. Qayta ro\'yxatdan o\'ting' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
};

// ─── 3. Login ─────────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
    }

    if (!user.isVerified) {
      // Yangi kod yuboramiz
      const code = generateCode();
      user.verificationCode = code;
      user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
      user.markModified('verificationCode');
      await user.save();
      await sendVerificationCode(email, code);

      return res.status(403).json({
        message: 'Email tasdiqlanmagan. Yangi kod yuborildi',
        requireVerification: true,
        email,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
};

// ─── 4. Parolni tiklash — kod yuborish ───────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Xavfsizlik uchun user topilmasa ham xuddi shu javobni beramiz
    if (!user || !user.isVerified) {
      return res.json({ message: 'Agar bu email ro\'yxatdan o\'tgan bo\'lsa, kod yuborildi' });
    }

    const code = generateCode();
    user.resetPasswordCode = code;
    user.resetPasswordCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.markModified('resetPasswordCode');
    await user.save();

    await sendPasswordResetCode(email, code);

    res.json({ message: 'Agar bu email ro\'yxatdan o\'tgan bo\'lsa, kod yuborildi', email });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
};

// ─── 5. Yangi parol o'rnatish ─────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User topilmadi' });
    }

    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ message: 'Kod noto\'g\'ri' });
    }

    if (user.resetPasswordCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Kod muddati tugagan' });
    }

    user.password = newPassword;
    user.resetPasswordCode = null;
    user.resetPasswordCodeExpires = null;
    await user.save();

    res.json({ message: 'Parol muvaffaqiyatli yangilandi' });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
};

// ─── 6. Profil ───────────────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('completedTopics', '_id');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
};