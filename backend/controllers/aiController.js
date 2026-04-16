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

module.exports = { getFeedback, saveSession, getSessionHistory };