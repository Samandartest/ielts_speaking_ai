const MockExam = require('../models/MockExam');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { incrementLimit } = require('../middleware/limitCheck');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Yangi mock exam boshlash
const startMockExam = async (req, res) => {
  try {
    const existing = await MockExam.findOne({
      user: req.user._id,
      status: 'in_progress',
    });
    if (existing) {
      return res.json({ mockExamId: existing._id, message: 'Davom etayotgan exam mavjud' });
    }
    const mockExam = await MockExam.create({ user: req.user._id, parts: [] });
    res.status(201).json({ mockExamId: mockExam._id });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik', error: error.message });
  }
};

// Part natijasini saqlash
const submitPart = async (req, res) => {
  try {
    const { mockExamId, partNumber, answers } = req.body;

    const mockExam = await MockExam.findOne({ _id: mockExamId, user: req.user._id });
    if (!mockExam) return res.status(404).json({ message: 'Mock exam topilmadi' });

    const avgScore = answers.reduce((s, a) => s + a.score, 0) / answers.length;

    mockExam.parts.push({
      partNumber,
      answers,
      averageScore: Math.round(avgScore * 10) / 10,
    });

    // Barcha 3 part tugagan bo'lsa — yakunlashtirish
    if (mockExam.parts.length >= 3) {
      mockExam.status = 'completed';
      mockExam.completedAt = new Date();
      mockExam.overallBandScore = mockExam.calculateBandScore();

      const xpEarned = Math.round(mockExam.overallBandScore * 50);
      mockExam.xpEarned = xpEarned;

      const user = await User.findById(req.user._id);
      user.xp += xpEarned;
      user.calculateLevel();
      user.totalSessions += 1;
      user.updateStreak();
      await user.save();

      await incrementLimit(req.user._id, 'speaking');
    }

    await mockExam.save();

    res.json({
      mockExamId: mockExam._id,
      status: mockExam.status,
      partsCompleted: mockExam.parts.length,
      overallBandScore: mockExam.status === 'completed' ? mockExam.overallBandScore : null,
      xpEarned: mockExam.status === 'completed' ? mockExam.xpEarned : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik', error: error.message });
  }
};

// Mock exam tarixini olish
const getMockExamHistory = async (req, res) => {
  try {
    const exams = await MockExam.find({ user: req.user._id, status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(10);
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Xatolik', error: error.message });
  }
};

module.exports = { startMockExam, submitPart, getMockExamHistory };