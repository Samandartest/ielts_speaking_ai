import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { startMockExam, submitMockPart, getQuestions, getParts, getAIFeedback } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PARTS_INFO = [
  { partNumber: 1, title: 'Part 1 — Introduction', desc: 'Oddiy savollar: uy, ish, qiziqishlar', duration: '4-5 daqiqa', questions: 4 },
  { partNumber: 2, title: 'Part 2 — Long Turn', desc: 'Bitta mavzu haqida 2 daqiqa gapirish', duration: '3-4 daqiqa', questions: 1 },
  { partNumber: 3, title: 'Part 3 — Discussion', desc: 'Part 2 ga bog\'liq chuqur savollar', duration: '4-5 daqiqa', questions: 3 },
];

const MockExamSession = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [phase, setPhase] = useState('intro'); // intro | part | result
  const [currentPart, setCurrentPart] = useState(0);
  const [mockExamId, setMockExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [partAnswers, setPartAnswers] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.lang = 'en-US';
      r.onresult = (e) => {
        let t = '';
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        setUserAnswer(t);
      };
      r.onerror = () => setIsListening(false);
      r.onend = () => setIsListening(false);
      recognitionRef.current = r;
    }
  }, []);

  const speak = (text) => new Promise((resolve) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.9;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => { setIsSpeaking(false); resolve(); };
    u.onerror = () => { setIsSpeaking(false); resolve(); };
    speechSynthesis.speak(u);
  });

  const startExam = async () => {
    setLoading(true);
    try {
      const { data } = await startMockExam();
      setMockExamId(data.mockExamId);

      const partsRes = await getParts();
      const part1 = partsRes.data.find((p) => p.partNumber === 1);
      if (part1) {
        const qRes = await getQuestions(null, { partId: part1._id, limit: 4 });
        setQuestions(qRes.data.slice(0, 4));
      }

      setPhase('part');
      setCurrentPart(0);
      setCurrentQIdx(0);
    } catch (err) {
      alert('Xatolik yuz berdi');
    }
    setLoading(false);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setUserAnswer('');
      setFeedback(null);
      try { recognitionRef.current.start(); setIsListening(true); } catch {}
    }
  };

  const stopAndGetFeedback = async () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); }
    if (!userAnswer.trim()) return;

    setLoadingFeedback(true);
    try {
      const { data } = await getAIFeedback({
        question: questions[currentQIdx].text,
        userAnswer,
        partNumber: currentPart + 1,
      });
      setFeedback(data);
    } catch {}
    setLoadingFeedback(false);
  };

  const nextQuestion = async () => {
    const answer = {
      question: questions[currentQIdx].text,
      userAnswer,
      score: feedback?.score || 0,
      feedback: feedback?.feedback || {},
      improvedVersion: feedback?.improvedVersion || '',
    };

    const newAnswers = [...partAnswers, answer];
    setPartAnswers(newAnswers);
    setFeedback(null);
    setUserAnswer('');

    if (currentQIdx + 1 < questions.length) {
      setCurrentQIdx(currentQIdx + 1);
      await speak(questions[currentQIdx + 1].text);
    } else {
      // Part tugadi
      const res = await submitMockPart({
        mockExamId,
        partNumber: currentPart + 1,
        answers: newAnswers,
      });

      setAllResults([...allResults, { part: currentPart + 1, answers: newAnswers }]);

      if (res.data.status === 'completed') {
        setFinalResult(res.data);
        setPhase('result');
        await refreshUser();
      } else {
        // Keyingi partga o'tish
        setCurrentPart(currentPart + 1);
        setCurrentQIdx(0);
        setPartAnswers([]);
        // TODO: keyingi part savollarini yuklash
      }
    }
  };

  // ─── Intro ────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">
              🎓 Mock IELTS Speaking
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
              To'liq imtihon simulyatsiyasi
            </p>

            <div className="space-y-3 mb-8">
              {PARTS_INFO.map((p, i) => (
                <div key={p.partNumber} className={`flex gap-4 p-4 rounded-lg border transition-colors ${
                  i === 0 ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>{p.partNumber}</div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{p.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{p.desc}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">⏱ {p.duration}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={startExam}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Tayyorlanmoqda...' : '🚀 Imtihonni boshlash'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Result ───────────────────────────────────────────────────────────────
  if (phase === 'result' && finalResult) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center mb-6 transition-colors">
            <div className="text-5xl mb-3">🏆</div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Imtihon tugadi!</h1>
            <div className="mt-4 mb-6">
              <p className="text-gray-500 dark:text-gray-400 mb-2">Sizning IELTS Band Score:</p>
              <div className={`text-5xl font-bold px-8 py-4 rounded-2xl inline-block ${
                finalResult.overallBandScore >= 7
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                  : finalResult.overallBandScore >= 5.5
                  ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
              }`}>
                {finalResult.overallBandScore}
              </div>
            </div>
            <div className="flex justify-center gap-4 mb-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-orange-500">+{finalResult.xpEarned}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">XP qazondingiz</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Dashboard ga qaytish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active part ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-6 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4">

        {/* Part progress header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-800 dark:text-white">
              {PARTS_INFO[currentPart]?.title}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Savol {currentQIdx + 1}/{questions.length}
            </span>
          </div>
          <div className="flex gap-1">
            {PARTS_INFO.map((_, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full transition-colors ${
                i < currentPart ? 'bg-green-500'
                : i === currentPart ? 'bg-blue-500'
                : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            ))}
          </div>
        </div>

        {/* AI Examiner */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-4 transition-colors">
          <div className="flex items-start gap-4">
            <div className={`text-4xl ${isSpeaking ? 'animate-bounce' : ''}`}>🤖</div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1">AI Examiner</p>
              <p className="text-lg text-gray-800 dark:text-white font-medium">
                {questions[currentQIdx]?.text}
              </p>
            </div>
          </div>
        </div>

        {/* Answer */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-4 transition-colors">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-2">Javobingiz</p>
          {userAnswer ? (
            <p className="text-gray-800 dark:text-gray-200 italic mb-4">"{userAnswer}"</p>
          ) : (
            <p className="text-gray-400 italic mb-4">
              {isListening ? 'Eshitilmoqda...' : 'Mikrofon tugmasini bosing'}
            </p>
          )}

          <div className="flex justify-center gap-3">
            {!isListening && !feedback && (
              <button
                onClick={startListening}
                disabled={isSpeaking}
                className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                🎤 Gapirish
              </button>
            )}
            {isListening && (
              <button
                onClick={stopAndGetFeedback}
                className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 animate-pulse transition-colors"
              >
                ⏹ To'xtatish
              </button>
            )}
          </div>
        </div>

        {loadingFeedback && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center transition-colors">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Tahlil qilinmoqda...</p>
          </div>
        )}

        {feedback && !loadingFeedback && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-gray-600 dark:text-gray-400 font-semibold">Ball:</span>
              <span className={`text-xl font-bold px-3 py-0.5 rounded-full ${
                feedback.score >= 7 ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                : feedback.score >= 5.5 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
              }`}>
                {feedback.score} / 9
              </span>
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={startListening}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                🔄 Qayta
              </button>
              <button
                onClick={nextQuestion}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                {currentQIdx + 1 < questions.length ? '➡️ Keyingi' : '✅ Partni tugatish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockExamSession;