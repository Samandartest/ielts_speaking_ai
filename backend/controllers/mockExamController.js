const MockExam = require('../models/MockExam');
const User = require('../models/User');
const Part = require('../models/Part');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const { incrementMockExamLimit } = require('../middleware/limitCheck');

const getMockExamQuestions = async (req, res) => {
  try {
    const parts = await Part.find().sort({ partNumber: 1 });
    if (parts.length < 3) {
      return res.status(400).json({ message: 'Kamida 3 ta part kerak' });
    }

    const partQuestions = {};

    for (const part of parts) {
      const topics = await Topic.find({ part: part._id });
      if (topics.length === 0) continue;

      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      const questions = await Question.find({ topic: randomTopic._id }).sort({ order: 1 });

      let count;
      if (part.partNumber === 1) count = 4;
      else if (part.partNumber === 2) count = 1;
      else count = 3;

      partQuestions[part.partNumber] = {
        partId: part._id,
        partNumber: part.partNumber,
        title: part.title,
        topicName: randomTopic.name,
        questions: questions.slice(0, count),
      };
    }

    res.json(partQuestions);
  } catch (error) {
    res.status(500).json({ message: 'Xatolik', error: error.message });
  }
};

const startMockExam = async (req, res) => {
  try {
    // Avvalgi in_progress ni bekor qilish
    await MockExam.deleteMany({ user: req.user._id, status: 'in_progress' });

    const mockExam = await MockExam.create({ user: req.user._id, parts: [] });
    res.status(201).json({ mockExamId: mockExam._id });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik', error: error.message });
  }
};

const submitPart = async (req, res) => {
  try {
    const { mockExamId, partNumber, answers } = req.body;

    const mockExam = await MockExam.findOne({ _id: mockExamId, user: req.user._id });
    if (!mockExam) return res.status(404).json({ message: 'Mock exam topilmadi' });

    const validAnswers = answers.filter((a) => a.score > 0);
    const avgScore = validAnswers.length > 0
      ? validAnswers.reduce((s, a) => s + a.score, 0) / validAnswers.length
      : 0;

    mockExam.parts.push({
      partNumber,
      answers,
      averageScore: Math.round(avgScore * 10) / 10,
    });

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

      // Haftalik mock limit hisoblash
      await incrementMockExamLimit(req.user._id);
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

// Imtihonni yarim yo'lda bekor qilish
const cancelMockExam = async (req, res) => {
  try {
    const { mockExamId } = req.body;
    const result = await MockExam.findOneAndDelete({
      _id: mockExamId,
      user: req.user._id,
      status: 'in_progress',
    });

    if (!result) {
      return res.status(404).json({ message: 'Aktiv mock exam topilmadi' });
    }

    res.json({ message: 'Mock exam bekor qilindi' });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik', error: error.message });
  }
};

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

module.exports = { getMockExamQuestions, startMockExam, submitPart, cancelMockExam, getMockExamHistory };