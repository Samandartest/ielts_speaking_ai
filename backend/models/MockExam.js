const mongoose = require('mongoose');

const partResultSchema = new mongoose.Schema({
  partNumber: { type: Number, required: true },
  answers: [{
    question: String,
    userAnswer: String,
    score: Number,
    feedback: {
      fluency: String,
      vocabulary: String,
      grammar: String,
      pronunciation: String,
    },
    improvedVersion: String,
    pronunciationScore: { type: Number, default: null },
  }],
  averageScore: { type: Number, default: 0 },
});

const mockExamSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress',
  },
  parts: [partResultSchema],
  overallBandScore: { type: Number, default: 0 },
  xpEarned: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

// Overall band score hisoblash (IELTS formula)
mockExamSchema.methods.calculateBandScore = function () {
  if (!this.parts || this.parts.length === 0) return 0;
  const total = this.parts.reduce((sum, p) => sum + p.averageScore, 0);
  const raw = total / this.parts.length;
  // IELTS: 0.5 ga yaqinlashtiriladi
  return Math.round(raw * 2) / 2;
};

module.exports = mongoose.model('MockExam', mockExamSchema);