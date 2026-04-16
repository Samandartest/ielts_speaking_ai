const rateLimit = require('express-rate-limit');

// Umumiy API limit — har 15 daqiqada max 100 so'rov
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Juda ko\'p so\'rov yuborildi. 15 daqiqadan keyin qayta urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limit — brute-force himoya (15 daqiqada max 10 urinish)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Juda ko\'p urinish. 15 daqiqadan keyin qayta urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP kod yuborish — spam himoya (1 soatda max 5 ta)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Juda ko\'p kod so\'raldi. 1 soatdan keyin qayta urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter, otpLimiter };