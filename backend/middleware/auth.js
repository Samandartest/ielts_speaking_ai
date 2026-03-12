const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Tokenni olish
      token = req.headers.authorization.split(' ')[1];

      // Tokenni tekshirish
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Userni topish (parolsiz)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      res.status(401).json({ message: 'Avtorizatsiya xatosi, token yaroqsiz' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Avtorizatsiya xatosi, token topilmadi' });
  }
};

module.exports = { protect };