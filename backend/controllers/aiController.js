const { GoogleGenerativeAI } = require('@google/generative-ai');
const Session = require('../models/Session');
const User = require('../models/User');
const { incrementLimit } = require('../middleware/limitCheck');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Foydalanuvchi javobiga feedback berish ───────────────────────────────────
const getFeedback = async (req, res) => {
  try {
    const { question, userAnswer, partNumber } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({ message: 'Savol va javob kiritish shart' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `You are an expert IELTS speaking examiner.
The candidate is practicing IELTS Speaking Part ${partNumber || 1}.

Question asked: "${question}"
Candidate's answer: "${userAnswer}"

Please provide:
1. Score Estimate (out of 9, based on IELTS band descriptors for speaking)
2. Feedback: Brief constructive feedback covering:
   - Fluency & Coherence
   - Lexical Resource (vocabulary)
   - Grammatical Range & Accuracy
   - Pronunciation tips (if text suggests issues)
3. Improved Version: Rewrite the candidate's answer as a Band 7-8 level response.

Format your response as JSON:
{
  "score": 6.5,
  "feedback": {
    "fluency": "...",
    "vocabulary": "...",
    "grammar": "...",
    "pronunciation": "..."
  },
  "improvedVersion": "..."
}

IMPORTANT: Return ONLY valid JSON, no other text or markdown.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const feedback = JSON.parse(text);

    // Muvaffaqiyatli feedback olganda limit oshirish
    try {
      await incrementLimit(req.user._id, 'speaking');
      console.log('✅ Speaking limit incremented for:', req.user._id);
    } catch (e) {
      console.error('❌ incrementLimit failed:', e.message);
    }

    res.json(feedback);
  } catch (error) {
    console.error('AI Feedback xatosi:', error);
    res.status(500).json({ message: 'AI feedback olishda xatolik', error: error.message });
  }
};

// ─── Sessiyani saqlash + XP/Streak yangilash ─────────────────────────────────
const saveSession = async (req, res) => {
  try {
    const { topicId, partNumber, answers } = req.body;

    if (!topicId || !partNumber || !answers || answers.length === 0) {
      return res.status(400).json({ message: 'topicId, partNumber va answers kiritish shart' });
    }

    const xpEarned = answers.reduce((sum, a) => sum + Math.round(a.score * 10), 0);

    const session = await Session.create({
      user: req.user._id,
      topic: topicId,
      partNumber,
      answers,
      xpEarned,
    });

    const user = await User.findById(req.user._id);

    user.xp += xpEarned;
    user.calculateLevel();

    user.totalSessions += 1;
    const sessionAvg = session.averageScore;
    user.totalScore = Math.round(
      ((user.totalScore * (user.totalSessions - 1) + sessionAvg) / user.totalSessions) * 10
    ) / 10;

    user.updateStreak();

    const alreadyCompleted = user.completedTopics.some(
      (id) => id.toString() === topicId.toString()
    );
    if (!alreadyCompleted) {
      user.completedTopics.push(topicId);
    }

    await user.save();

    res.status(201).json({
      message: 'Sessiya saqlandi!',
      sessionId: session._id,
      averageScore: session.averageScore,
      xpEarned,
      newXp: user.xp,
      newLevel: user.level,
      currentStreak: user.currentStreak,
    });
  } catch (error) {
    console.error('Sessiya saqlash xatosi:', error);
    res.status(500).json({ message: 'Sessiyani saqlashda xatolik', error: error.message });
  }
};

// ─── Foydalanuvchi sessiya tarixini olish ─────────────────────────────────────
const getSessionHistory = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .populate('topic', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Tarixni olishda xatolik', error: error.message });
  }
};

// ─── Progress ma'lumotlari ─────────────────────────────────────────────────
const getProgress = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .sort({ createdAt: 1 })
      .populate('topic', 'name');

    if (sessions.length === 0) {
      return res.json({ sessions: [], prediction: null });
    }

    // Haftalik guruhlash
    const weeklyMap = {};
    sessions.forEach((s) => {
      const d = new Date(s.createdAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!weeklyMap[key]) weeklyMap[key] = { scores: [], count: 0, date: key };
      weeklyMap[key].scores.push(s.averageScore);
      weeklyMap[key].count++;
    });

    const weekly = Object.values(weeklyMap).map((w) => ({
      date: w.date,
      avgScore: Math.round((w.scores.reduce((a, b) => a + b, 0) / w.scores.length) * 10) / 10,
      sessionCount: w.count,
    }));

    // ─── Bashorat algoritmi ─────────────────────────────────────────────
    const prediction = calculatePrediction(sessions);

    res.json({ sessions: weekly, prediction, totalSessions: sessions.length });
  } catch (error) {
    res.status(500).json({ message: 'Progress olishda xatolik', error: error.message });
  }
};

const calculatePrediction = (sessions) => {
  if (sessions.length < 3) return null;

  const now = new Date();

  // 1. Score trayektoriyasi (linear regression)
  const n = sessions.length;
  const xs = sessions.map((_, i) => i);
  const ys = sessions.map((s) => s.averageScore);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const slope = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0) /
    xs.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);

  const currentScore = ys[ys.length - 1];

  // 2. Consistency index — so'nggi 14 kundagi faollik
  const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
  const recentSessions = sessions.filter((s) => new Date(s.createdAt) > twoWeeksAgo);
  const consistencyIndex = Math.min(recentSessions.length / 14, 1); // 0..1

  // 3. Decay factor — oxirgi sessiyadan necha kun o'tgan
  const lastSessionDate = new Date(sessions[sessions.length - 1].createdAt);
  const daysSinceLastSession = (now - lastSessionDate) / (1000 * 60 * 60 * 24);
  const decayFactor = daysSinceLastSession > 7
    ? Math.max(0.3, 1 - (daysSinceLastSession - 7) * 0.05)
    : 1;

  // 4. Sessiya sifati (o'rtacha score)
  const avgScore = yMean;
  const qualityFactor = avgScore / 9;

  // 5. Har bir davr uchun bashorat
  const predict = (days) => {
    const sessionsPerDay = recentSessions.length / 14;
    const futureSessions = sessionsPerDay * days * consistencyIndex * decayFactor;
    const scoreGain = slope * futureSessions * qualityFactor;
    const predicted = Math.min(9, Math.max(0, currentScore + scoreGain));
    return Math.round(predicted * 10) / 10;
  };

  // Potensial o'sish (agar har kuni mashq qilsa)
  const predictOptimal = (days) => {
    const futureSessions = days * 0.9;
    const scoreGain = slope * futureSessions * qualityFactor * 1.2;
    const predicted = Math.min(9, Math.max(0, currentScore + scoreGain));
    return Math.round(predicted * 10) / 10;
  };

  return {
    currentScore,
    consistencyIndex: Math.round(consistencyIndex * 100),
    decayFactor: Math.round(decayFactor * 100),
    daysSinceLastSession: Math.round(daysSinceLastSession),
    forecast: {
      days30: { realistic: predict(30), optimal: predictOptimal(30) },
      days60: { realistic: predict(60), optimal: predictOptimal(60) },
      days90: { realistic: predict(90), optimal: predictOptimal(90) },
    },
    trend: slope > 0.01 ? 'rising' : slope < -0.01 ? 'falling' : 'stable',
    weeklySessionsAvg: Math.round(recentSessions.length / 2 * 10) / 10,
    recommendation: getRecommendation(consistencyIndex, decayFactor, slope),
  };
};

const getRecommendation = (consistency, decay, slope) => {
  if (decay < 0.6) return { uz: "Ko'p kun mashq qilmadingiz! Bugun qaytib keling.", ru: "Вы давно не практиковались! Вернитесь сегодня.", en: "You've been away too long! Come back today." };
  if (consistency < 0.3) return { uz: "Kunlik mashq qiling — natija 2x tezroq o'sadi.", ru: "Практикуйтесь ежедневно — прогресс в 2 раза быстрее.", en: "Practice daily — progress grows 2x faster." };
  if (slope < 0) return { uz: "Ball pasaymoqda. Qiyinroq topiclar bilan ishlang.", ru: "Балл снижается. Работайте над сложными темами.", en: "Score is dropping. Focus on harder topics." };
  return { uz: "Zo'r ketayapsiz! Shu tezlikda davom eting.", ru: "Отличный прогресс! Продолжайте в том же темпе.", en: "Great progress! Keep up this pace." };
};

module.exports = { getFeedback, saveSession, getSessionHistory, getProgress };