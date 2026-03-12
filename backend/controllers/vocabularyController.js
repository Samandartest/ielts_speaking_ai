const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getVocabulary = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic kiritish shart' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `You are an IELTS speaking vocabulary expert. 
    Given the topic "${topic}", provide 10-15 useful vocabulary words/phrases 
    that are commonly used in IELTS speaking. 
    
    For each word/phrase provide:
    1. The word/phrase
    2. A brief definition
    3. An example sentence using it in a speaking context
    
    Format your response as a JSON array like this:
    [
      {
        "word": "word or phrase",
        "definition": "brief definition",
        "example": "example sentence in speaking context"
      }
    ]
    
    IMPORTANT: Return ONLY the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // JSON ni tozalash (agar markdown code block ichida bo'lsa)
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const vocabulary = JSON.parse(text);

    res.json({ topic, vocabulary });
  } catch (error) {
    console.error('Gemini API xatosi:', error);
    res.status(500).json({ message: 'Vocabulary olishda xatolik', error: error.message });
  }
};

module.exports = { getVocabulary };