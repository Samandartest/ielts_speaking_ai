import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuestions, getAIFeedback } from '../../services/api';

const SpeakingSession = () => {
  const { topicId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionHistory, feedback, userAnswer]);

  // Savollarni olish
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await getQuestions(topicId);
        setQuestions(data);
      } catch (err) {
        console.error('Savollarni olishda xatolik');
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [topicId]);

  // Speech Recognition sozlash
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition xatosi:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.error('Speech Recognition bu brauzerda qo\'llab-quvvatlanmaydi');
    }
  }, []);

  // AI ovozda gapirishi (Text-to-Speech)
  const speak = (text) => {
    return new Promise((resolve) => {
      // Avvalgi ovozni to'xtatish
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  };

  // Sessiyani boshlash
  const startSession = async () => {
    setStarted(true);
    setCurrentIndex(0);
    setSessionHistory([]);
    setFeedback(null);
    setUserAnswer('');

    // Birinchi savolni o'qish
    if (questions.length > 0) {
      await speak(questions[0].text);
    }
  };

  // Gaprishni boshlash (mikrofon)
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setUserAnswer('');
      setFeedback(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Mikrofon boshlanmadi:', err);
      }
    }
  };

  // Gaprishni to'xtatish va feedback olish
  const stopListeningAndGetFeedback = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (!userAnswer.trim()) return;

    setLoadingFeedback(true);
    setFeedback(null);

    try {
      const { data } = await getAIFeedback({
        question: questions[currentIndex].text,
        userAnswer: userAnswer,
        partNumber: 1,
      });

      setFeedback(data);

      // Tarixga qo'shish
      setSessionHistory((prev) => [
        ...prev,
        {
          question: questions[currentIndex].text,
          answer: userAnswer,
          feedback: data,
        },
      ]);

      // Feedbackni ovozda o'qish
      const feedbackSpeech = `Your estimated score is ${data.score}. Here's an improved version: ${data.improvedVersion}`;
      await speak(feedbackSpeech);
    } catch (err) {
      console.error('Feedback olishda xatolik:', err);
    }

    setLoadingFeedback(false);
  };

  // Keyingi savolga o'tish
  const nextQuestion = async () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setUserAnswer('');
      setFeedback(null);

      // Keyingi savolni ovozda o'qish
      await speak(questions[nextIndex].text);
    } else {
      // Barcha savollar tugadi
      setSessionEnded(true);
      await speak('That is the end of the speaking session. Well done!');
    }
  };

  // Savolni qayta eshitish
  const repeatQuestion = async () => {
    if (questions[currentIndex]) {
      await speak(questions[currentIndex].text);
    }
  };

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ===== SESSIYA BOSHLANMAGAN =====
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/speaking" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Ortga
          </Link>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">🎤 Speaking Session</h1>
            <p className="text-gray-600 mb-2">
              Bu sessiyada <strong>{questions.length} ta savol</strong> bor.
            </p>
            <p className="text-gray-500 mb-6">
              AI har bir savolni ovozda so'raydi → Siz ovozda javob berasiz →
              AI feedback va improved version beradi → Keyingi savol
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-yellow-800 font-semibold mb-1">⚠️ Tayyorgarlik:</p>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Chrome yoki Edge brauzer ishlating (Speech API uchun)</li>
                <li>• Mikrofon ruxsatini bering</li>
                <li>• Tinch muhitda bo'ling</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-2">Savollar:</h3>
              {questions.map((q, i) => (
                <p key={q._id} className="text-gray-700 mb-1 text-sm">
                  {i + 1}. {q.text}
                </p>
              ))}
            </div>

            <button
              onClick={startSession}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-blue-700 transition-colors"
            >
              🚀 Start Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== SESSIYA TUGAGAN =====
  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-8">
            <h1 className="text-3xl font-bold text-green-600 mb-4">��� Sessiya tugadi!</h1>
            <p className="text-gray-600 mb-6">
              Jami {sessionHistory.length} ta savolga javob berdingiz. Ajoyib!
            </p>
            <Link
              to="/speaking"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Boshqa topic tanlash
            </Link>
          </div>

          {/* Sessiya tarixi */}
          {sessionHistory.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">📋 Sessiya natijalari</h2>
              {sessionHistory.map((item, index) => (
                <div key={index} className="bg-white rounded-xl shadow p-6">
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 font-semibold">
                      Savol {index + 1}:
                    </p>
                    <p className="text-gray-800 font-medium">{item.question}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-blue-600 font-semibold">Sizning javobingiz:</p>
                    <p className="text-gray-700 italic">"{item.answer}"</p>
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-semibold">Ball:</span>
                    <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full">
                      {item.feedback.score} / 9
                    </span>
                  </div>
                  <div className="mb-3 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Feedback:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>💬 <strong>Fluency:</strong> {item.feedback.feedback.fluency}</li>
                      <li>📚 <strong>Vocabulary:</strong> {item.feedback.feedback.vocabulary}</li>
                      <li>✏️ <strong>Grammar:</strong> {item.feedback.feedback.grammar}</li>
                      <li>🗣️ <strong>Pronunciation:</strong> {item.feedback.feedback.pronunciation}</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-700 mb-1">
                      ✨ Improved Version:
                    </p>
                    <p className="text-green-800">"{item.feedback.improvedVersion}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== AKTIV SESSIYA =====
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/speaking" className="text-blue-600 hover:underline">
            ← Ortga
          </Link>
          <button
            onClick={() => setSessionEnded(true)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm"
          >
            ⏹ Tugatish
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Savol {currentIndex + 1} / {questions.length}</span>
            <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* AI Examiner - Savol */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div
              className={`text-4xl ${isSpeaking ? 'animate-bounce' : ''}`}
            >
              🤖
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-semibold mb-1">
                AI Examiner
              </p>
              <p className="text-lg text-gray-800 font-medium">
                {questions[currentIndex]?.text}
              </p>
              {isSpeaking && (
                <p className="text-blue-500 text-sm mt-2 animate-pulse">
                  🔊 Gapirmoqda...
                </p>
              )}
            </div>
            <button
              onClick={repeatQuestion}
              disabled={isSpeaking || isListening}
              className="text-gray-400 hover:text-blue-600 disabled:opacity-30"
              title="Qayta eshitish"
            >
              🔄
            </button>
          </div>
        </div>

        {/* User Answer Area */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🙋</div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-semibold mb-1">
                Sizning javobingiz
              </p>

              {userAnswer ? (
                <p className="text-gray-800 italic">"{userAnswer}"</p>
              ) : (
                <p className="text-gray-400 italic">
                  {isListening
                    ? 'Eshitilmoqda... Gapiring!'
                    : 'Mikrofon tugmasini bosing va gapiring'}
                </p>
              )}
            </div>
          </div>

          {/* Mikrofon tugmalari */}
          <div className="flex justify-center mt-6 gap-4">
            {!isListening && !feedback && (
              <button
                onClick={startListening}
                disabled={isSpeaking || loadingFeedback}
                className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-lg"
              >
                🎤 Gapirish
              </button>
            )}

            {isListening && (
              <button
                onClick={stopListeningAndGetFeedback}
                className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 flex items-center gap-2 text-lg animate-pulse"
              >
                ⏹ To'xtatish va Feedback olish
              </button>
            )}
          </div>

          {/* Listening animatsiya */}
          {isListening && (
            <div className="flex justify-center mt-4 gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 25 + 10}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.6s',
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>

        {/* Loading Feedback */}
        {loadingFeedback && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">AI javobingizni tahlil qilmoqda...</p>
          </div>
        )}

        {/* Feedback */}
        {feedback && !loadingFeedback && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📝 AI Feedback</h3>

            {/* Score */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-gray-600 font-semibold">Ball:</span>
              <span
                className={`text-2xl font-bold px-4 py-1 rounded-full ${
                  feedback.score >= 7
                    ? 'bg-green-100 text-green-800'
                    : feedback.score >= 5.5
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {feedback.score} / 9
              </span>
            </div>

            {/* Feedback tafsilotlari */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
              <p className="text-sm">
                <span className="font-semibold text-gray-700">💬 Fluency:</span>{' '}
                <span className="text-gray-600">{feedback.feedback.fluency}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-700">📚 Vocabulary:</span>{' '}
                <span className="text-gray-600">{feedback.feedback.vocabulary}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-700">✏️ Grammar:</span>{' '}
                <span className="text-gray-600">{feedback.feedback.grammar}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-700">🗣️ Pronunciation:</span>{' '}
                <span className="text-gray-600">{feedback.feedback.pronunciation}</span>
              </p>
            </div>

            {/* Improved Version */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-green-700 mb-1">
                ✨ Improved Version (Band 7-8):
              </p>
              <p className="text-green-800 leading-relaxed">
                "{feedback.improvedVersion}"
              </p>
            </div>

            {/* Keyingi savol tugmasi */}
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={startListening}
                className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300"
              >
                🔄 Qayta javob berish
              </button>
              <button
                onClick={nextQuestion}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                {currentIndex + 1 < questions.length
                  ? '➡️ Keyingi savol'
                  : '✅ Sessiyani tugatish'}
              </button>
            </div>
          </div>
        )}

        {/* Session History (pastda) */}
        {sessionHistory.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-700 mb-4">
              📋 Oldingi savollar ({sessionHistory.length})
            </h3>
            <div className="space-y-3">
              {sessionHistory.map((item, index) => (
                <details
                  key={index}
                  className="bg-white rounded-lg shadow p-4 cursor-pointer"
                >
                  <summary className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      {index + 1}. {item.question}
                    </span>
                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-sm">
                      {item.feedback.score}
                    </span>
                  </summary>
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Javob:</strong> "{item.answer}"
                    </p>
                    <p className="text-sm text-green-700">
                      <strong>Improved:</strong> "{item.feedback.improvedVersion}"
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default SpeakingSession;