import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMockExamQuestions, startMockExam, submitMockPart, getAIFeedback, cancelMockExam } from '../../services/api';


const MockExamSession = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [phase, setPhase] = useState('intro');
  const [currentPartIdx, setCurrentPartIdx] = useState(0);
  const [mockExamId, setMockExamId] = useState(null);

  // Barcha partlar uchun savollar: { 1: [...], 2: [...], 3: [...] }
  const [allPartQuestions, setAllPartQuestions] = useState({});
  const [partTitles, setPartTitles] = useState({});

  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [partAnswers, setPartAnswers] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [weeklyLimitError, setWeeklyLimitError] = useState('');

  const recognitionRef = useRef(null);

  const partNumbers = [1, 2, 3];
  const currentPartNumber = partNumbers[currentPartIdx];
  const currentQuestions = allPartQuestions[currentPartNumber] || [];

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
    u.lang = 'en-US';
    u.rate = 0.9;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => { setIsSpeaking(false); resolve(); };
    u.onerror = () => { setIsSpeaking(false); resolve(); };
    speechSynthesis.speak(u);
  });

  const startExam = async () => {
    setLoading(true);
    setError('');
    try {
      // Avval barcha partlar uchun random savollarni olish
      const questionsRes = await getMockExamQuestions();
      const questionsData = questionsRes.data; // { 1: {...}, 2: {...}, 3: {...} }

      // Tekshirish
      const hasAllParts = [1, 2, 3].every(
        (p) => questionsData[p] && questionsData[p].questions && questionsData[p].questions.length > 0
      );
      if (!hasAllParts) {
        setError("DB da yetarli savollar yo'q. Admin dan so'rang.");
        setLoading(false);
        return;
      }

      // Mock exam boshlash
      const examRes = await startMockExam();
      setMockExamId(examRes.data.mockExamId);

      // Savollarni state ga saqlash
      const questionsMap = {};
      const titlesMap = {};
      [1, 2, 3].forEach((p) => {
        questionsMap[p] = questionsData[p].questions;
        titlesMap[p] = {
          title: questionsData[p].title,
          topicName: questionsData[p].topicName,
        };
      });

      setAllPartQuestions(questionsMap);
      setPartTitles(titlesMap);
      setCurrentPartIdx(0);
      setCurrentQIdx(0);
      setPartAnswers([]);
      setPhase('part');

      // Birinchi savolni o'qish
      await speak(questionsMap[1][0].text);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Xatolik yuz berdi';
      if (status === 429) {
        setWeeklyLimitError(`${msg}. Keyingi dushanba: ${err.response?.data?.resetsAt || ''}`);
      } else {
        setError(msg);
      }
    }
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
        question: currentQuestions[currentQIdx].text,
        userAnswer,
        partNumber: currentPartNumber,
      });
      setFeedback(data);
    } catch (err) {
      setError('AI feedback olishda xatolik');
    }
    setLoadingFeedback(false);
  };

  const nextQuestion = async () => {
    // Javobni saqlaymiz
    const answer = {
      question: currentQuestions[currentQIdx].text,
      userAnswer: userAnswer || '(javob berilmadi)',
      score: feedback?.score || 0,
      feedback: feedback?.feedback || {},
      improvedVersion: feedback?.improvedVersion || '',
    };

    const newAnswers = [...partAnswers, answer];

    if (currentQIdx + 1 < currentQuestions.length) {
      // Keyingi savol — shu partda
      setPartAnswers(newAnswers);
      setFeedback(null);
      setUserAnswer('');
      setCurrentQIdx(currentQIdx + 1);
      await speak(currentQuestions[currentQIdx + 1].text);
    } else {
      // Part tugadi — serverga yuboramiz
      try {
        const res = await submitMockPart({
          mockExamId,
          partNumber: currentPartNumber,
          answers: newAnswers,
        });

        if (res.data.status === 'completed') {
          // Exam tugadi
          setFinalResult(res.data);
          setPhase('result');
          await refreshUser();
        } else {
          // Keyingi partga o'tish
          const nextPartIdx = currentPartIdx + 1;
          const nextPartNumber = partNumbers[nextPartIdx];
          const nextQuestions = allPartQuestions[nextPartNumber];

          setCurrentPartIdx(nextPartIdx);
          setCurrentQIdx(0);
          setPartAnswers([]);
          setFeedback(null);
          setUserAnswer('');

          // Part orasida break xabari
          setPhase('part_break');
          setTimeout(async () => {
            setPhase('part');
            await speak(nextQuestions[0].text);
          }, 3000);
        }
      } catch (err) {
        setError('Partni saqlashda xatolik: ' + (err.response?.data?.message || ''));
      }
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Imtihonni yarim yo\'lda tugatmoqchimisiz? Natija saqlanmaydi.')) return;
    setCancelLoading(true);
    try {
      if (mockExamId) await cancelMockExam(mockExamId);
    } catch {}
    setCancelLoading(false);
    navigate('/dashboard');
  };

  // ─── INTRO ────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">
              🎓 Mock IELTS Speaking
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
              To'liq imtihon simulyatsiyasi — random topiclar
            </p>

            <div className="space-y-3 mb-6">
              {[
                { num: 1, title: 'Part 1 — Introduction', desc: '4 ta savol, tanish mavzular', time: '4-5 daqiqa', color: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20', numColor: 'bg-blue-600 text-white' },
                { num: 2, title: 'Part 2 — Long Turn', desc: '1 ta cue card, 2 daqiqa gapirish', time: '3-4 daqiqa', color: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20', numColor: 'bg-purple-600 text-white' },
                { num: 3, title: 'Part 3 — Discussion', desc: '3 ta chuqur savol', time: '4-5 daqiqa', color: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20', numColor: 'bg-green-600 text-white' },
              ].map((p) => (
                <div key={p.num} className={`flex gap-4 p-4 rounded-xl border transition-colors ${p.color}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${p.numColor}`}>
                    {p.num}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{p.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{p.desc}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">⏱ {p.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                🎲 Har safar <strong>random topiclar</strong> tanlanadi — haqiqiy imtihon kabi
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={startExam}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Savollar tayyorlanmoqda...
                </span>
              ) : '🚀 Imtihonni boshlash'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PART BREAK ───────────────────────────────────────────────────────────
  if (phase === 'part_break') {
    const nextPartNumber = partNumbers[currentPartIdx];
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 text-center max-w-sm mx-4 transition-colors">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Part {currentPartNumber - 1} tugadi!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Part {nextPartNumber} boshlanmoqda...
          </p>
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {partTitles[nextPartNumber]?.topicName && `Mavzu: ${partTitles[nextPartNumber].topicName}`}
          </div>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULT ───────────────────────────────────────────────────────────────
  if (phase === 'result' && finalResult) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center mb-6 transition-colors">
            <div className="text-5xl mb-3">🏆</div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Imtihon tugadi!</h1>

            <p className="text-gray-500 dark:text-gray-400 mb-3">Sizning IELTS Band Score:</p>
            <div className={`text-6xl font-bold px-8 py-5 rounded-2xl inline-block mb-6 ${
              finalResult.overallBandScore >= 7
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                : finalResult.overallBandScore >= 5.5
                ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
            }`}>
              {finalResult.overallBandScore}
            </div>

            <div className="flex justify-center gap-4 mb-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-orange-500">+{finalResult.xpEarned}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">XP qazondingiz</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setPhase('intro')}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                🔄 Qayta topshirish
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE PART ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-6 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4">

        {/* Part progress header */}
        <div className="flex justify-end mb-3">
          <button
            onClick={handleCancel}
            disabled={cancelLoading}
            className="text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelLoading ? '...' : '⏹ Imtihonni tugatish'}
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4 transition-colors">
          <div className="flex justify-between items-center mb-1">
            <div>
              <span className="font-bold text-gray-800 dark:text-white text-sm">
                Part {currentPartNumber} — {partTitles[currentPartNumber]?.topicName || ''}
              </span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentQIdx + 1}/{currentQuestions.length}
            </span>
          </div>
          <div className="flex gap-1.5 mt-2">
            {partNumbers.map((_, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                i < currentPartIdx ? 'bg-green-500'
                : i === currentPartIdx ? 'bg-blue-500'
                : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            ))}
          </div>
          {/* Savol progressi */}
          <div className="mt-1.5 flex gap-1">
            {currentQuestions.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                i < currentQIdx ? 'bg-blue-400'
                : i === currentQIdx ? 'bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-600'
              }`} />
            ))}
          </div>
        </div>

        {/* AI Examiner */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-4 transition-colors">
          <div className="flex items-start gap-4">
            <div className={`text-4xl ${isSpeaking ? 'animate-bounce' : ''}`}>🤖</div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1">AI Examiner</p>
              <p className="text-lg text-gray-800 dark:text-white font-medium leading-relaxed">
                {currentQuestions[currentQIdx]?.text}
              </p>
              {isSpeaking && (
                <p className="text-blue-500 text-sm mt-1 animate-pulse">🔊 Gapirmoqda...</p>
              )}
            </div>
          </div>
        </div>

        {/* Answer */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-4 transition-colors">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-2">Javobingiz</p>
          {userAnswer ? (
            <p className="text-gray-800 dark:text-gray-200 italic mb-4">"{userAnswer}"</p>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic mb-4">
              {isListening ? 'Eshitilmoqda... Gapiring!' : 'Mikrofon tugmasini bosing va gapiring'}
            </p>
          )}

          <div className="flex justify-center gap-3">
            {!isListening && !feedback && (
              <button
                onClick={startListening}
                disabled={isSpeaking || loadingFeedback}
                className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50 text-lg transition-colors"
              >
                🎤 Gapirish
              </button>
            )}
            {isListening && (
              <button
                onClick={stopAndGetFeedback}
                className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 text-lg animate-pulse transition-colors"
              >
                ⏹ To'xtatish
              </button>
            )}
          </div>

          {isListening && (
            <div className="flex justify-center mt-3 gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-red-500 rounded-full animate-pulse"
                  style={{ height: `${Math.random() * 20 + 8}px`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loadingFeedback && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center mb-4 transition-colors">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">AI tahlil qilmoqda...</p>
          </div>
        )}
        {weeklyLimitError && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4 text-center">
            <div className="text-3xl mb-2">📅</div>
            <p className="font-semibold text-orange-700 dark:text-orange-400">Haftalik limit tugadi</p>
            <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">{weeklyLimitError}</p>
            <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
              💎 Premium oling — cheksiz mock exam!
            </p>
            <button
              onClick={() => navigate('/premium')}
              className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              👑 Premium ko'rish
            </button>
          </div>
        )}
        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Feedback */}
        {feedback && !loadingFeedback && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-gray-600 dark:text-gray-400 font-semibold">Ball:</span>
              <span className={`text-xl font-bold px-4 py-1 rounded-full ${
                feedback.score >= 7
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                  : feedback.score >= 5.5
                  ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
              }`}>
                {feedback.score} / 9
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4 space-y-1.5 transition-colors">
              <p className="text-xs"><span className="font-semibold text-gray-700 dark:text-gray-200">💬 Fluency:</span> <span className="text-gray-600 dark:text-gray-400">{feedback.feedback?.fluency}</span></p>
              <p className="text-xs"><span className="font-semibold text-gray-700 dark:text-gray-200">📚 Vocabulary:</span> <span className="text-gray-600 dark:text-gray-400">{feedback.feedback?.vocabulary}</span></p>
              <p className="text-xs"><span className="font-semibold text-gray-700 dark:text-gray-200">✏️ Grammar:</span> <span className="text-gray-600 dark:text-gray-400">{feedback.feedback?.grammar}</span></p>
            </div>

            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={startListening}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                🔄 Qayta
              </button>
              <button
                onClick={nextQuestion}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                {currentQIdx + 1 < currentQuestions.length
                  ? '➡️ Keyingi savol'
                  : currentPartIdx + 1 < partNumbers.length
                  ? `✅ Part ${currentPartNumber + 1} ga o'tish`
                  : '🏁 Imtihonni yakunlash'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockExamSession;