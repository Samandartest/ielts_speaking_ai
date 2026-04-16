const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  userAnswer: { type: String, required: true },
  score: { type: Number, required: true },
  feedback: {
    fluency: String,
    vocabulary: String,
    grammar: String,
    pronunciation: String,
  },
  improvedVersion: String,
});

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
  },
  partNumber: {
    type: Number,
    required: true,
  },
  answers: [answerSchema],
  averageScore: {
    type: Number,
    default: 0,
  },
  xpEarned: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Sessiya saqlanganda averageScore avtomatik hisoblanadi
sessionSchema.pre('save', function (next) {
  if (this.answers && this.answers.length > 0) {
    const total = this.answers.reduce((sum, a) => sum + a.score, 0);
    this.averageScore = Math.round((total / this.answers.length) * 10) / 10;
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
