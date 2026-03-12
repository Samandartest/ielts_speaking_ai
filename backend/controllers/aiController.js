const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Foydalanuvchi javobiga feedback berish
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
    1. **Score Estimate** (out of 9, based on IELTS band descriptors for speaking)
    2. **Feedback**: Brief constructive feedback covering:
       - Fluency & Coherence
       - Lexical Resource (vocabulary)
       - Grammatical Range & Accuracy
       - Pronunciation tips (if text suggests issues)
    3. **Improved Version**: Rewrite the candidate's answer as a Band 7-8 level response.

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
    const response = result.response;
    let text = response.text();

    // JSON tozalash
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const feedback = JSON.parse(text);

    res.json(feedback);
  } catch (error) {
    console.error('AI Feedback xatosi:', error);
    res.status(500).json({ message: 'AI feedback olishda xatolik', error: error.message });
  }
};

module.exports = { getFeedback };