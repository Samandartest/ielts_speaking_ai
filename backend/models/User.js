const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ism kiritish shart'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email kiritish shart'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Parol kiritish shart'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // XP tizimi
  xp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  // Streak tizimi
  currentStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  lastPracticeDate: {
    type: Date,
    default: null,
  },
  // Statistika
  totalSessions: {
    type: Number,
    default: 0,
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// XP dan level hisoblash (har 100 XP = 1 level)
userSchema.methods.calculateLevel = function () {
  this.level = Math.floor(this.xp / 100) + 1;
};

// Streak yangilash
userSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (this.lastPracticeDate) {
    const lastDate = new Date(this.lastPracticeDate);
    lastDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Bugun allaqachon practice qilgan — streak o'zgarmaydi
      return;
    } else if (diffDays === 1) {
      // Ketma-ket kun — streak davom etadi
      this.currentStreak += 1;
    } else {
      // Kun o'tkazib yuborilgan — streak 1 dan boshlanadi
      this.currentStreak = 1;
    }
  } else {
    // Birinchi marta practice
    this.currentStreak = 1;
  }

  // Eng uzun streak yangilash
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }

  this.lastPracticeDate = today;
};

module.exports = mongoose.model('User', userSchema);