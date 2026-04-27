import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getQuestions, getAIFeedback, saveSession } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const PREP_SECONDS = 60;
const SPEAK_SECONDS = 120;

const Part2Timer = ({ phase, secondsLeft, totalSeconds }) => {
  const { t } = useTranslation();
  const percent = Math.round((secondsLeft / totalSeconds) * 100);
  const color = secondsLeft <= 10 ? 'bg-red-500' : phase === 'prep' ? 'bg-yellow-400' : 'bg-blue-500';
  const label = phase === 'prep' ? t('speaking.part2prep') : t('speaking.part2speak');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-4 transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-700 dark:text-gray-200">{label}</span>
        <span className={`text-2xl font-mono font-bold ${secondsLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-800 dark:text-white'}`}>
          {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }} />
      </div>
      {phase === 'prep' && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{t('speaking.part2prepNote')}</p>
      )}
    </div>
  );
};

const XpPopup = ({ data, onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-4 transition-colors">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('speaking.savedSession')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-5">{t('dashboard.recentSessions')}:</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.averageScore}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('speaking.avgScoreLabel')}</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-3">
            <div className="text-2xl font-bold text-orange-500">+{data.xpEarned}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('speaking.xpEarned')}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-3">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.currentStreak}🔥</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('speaking.streakLabel')}</div>
          </div>
        </div>
        <button onClick={onClose} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
          {t('speaking.continueBtn')}
        </button>
      </div>
    </div>
  );
};

const PronunciationBar = ({ score }) => {
  if (score === null || score === undefined) return null;
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-400' : 'bg-red-500';
  const textColor = score >= 80
    ? 'text-green-600 dark:text-green-400'
    : score >= 60
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-red-600 dark:text-red-400';
  const bgColor = score >= 80
    ? 'bg-green-50 dark:bg-green-900/20'
    : score >= 60
    ? 'bg-yellow-50 dark:bg-yellow-900/20'
    : 'bg-red-50 dark:bg-red-900/20';

  return (
    <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg ${bgColor}`}>
      <span className="text-2xl">🗣️</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Talaffuz:{' '}
          <span className={textColor}>{score}%</span>
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
          <div
            className={`${color} h-1.5 rounded-full transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {score >= 80 ? "Ajoyib talaffuz! ✓" : score >= 60 ? "Yaxshi, lekin yaxshilanish mumkin" : "Ko'proq mashq qiling"}
        </p>
      </div>
    </div>
  );
};

const SpeakingSession = () => {
  const { topicId } = useParams();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const { t } = useTranslation();
  const partNumber = location.state?.partNumber || 1;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [pronunciationScore, setPronunciationScore] = useState(null); // ← YANGI
  const [feedback, setFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [xpResult, setXpResult] = useState(null);
  const [timerPhase, setTimerPhase] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isPart2 = partNumber === 2;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionHistory, feedback, userAnswer]);

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

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        let totalConfidence = 0;
        let finalCount = 0;

        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            totalConfidence += event.results[i][0].confidence;
            finalCount++;
          }
        }

        setUserAnswer(transcript);

        // Confidence score — faqat final resultlarda keladi
        if (finalCount > 0) {
          const avgConfidence = totalConfidence / finalCount;
          setPronunciationScore(Math.round(avgConfidence * 100));
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const startTimer = useCallback((phase) => {
    clearInterval(timerRef.current);
    const total = phase === 'prep' ? PREP_SECONDS : SPEAK_SECONDS;
    setTimerPhase(phase);
    setSecondsLeft(total);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (phase === 'prep') {
            setTimerPhase('speak');
            setSecondsLeft(SPEAK_SECONDS);
            timerRef.current = setInterval(() => {
              setSecondsLeft((p) => {
                if (p <= 1) {
                  clearInterval(timerRef.current);
                  if (recognitionRef.current) recognitionRef.current.stop();
                  return 0;
                }
                return p - 1;
              });
            }, 1000);
            setTimeout(() => {
              if (recognitionRef.current) {
                setUserAnswer('');
                setPronunciationScore(null);
                setFeedback(null);
                try { recognitionRef.current.start(); setIsListening(true); } catch {}
              }
            }, 300);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const speak = (text) => new Promise((resolve) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); resolve(); };
    utterance.onerror = () => { setIsSpeaking(false); resolve(); };
    speechSynthesis.speak(utterance);
  });

  const startSession = async () => {
    setStarted(true);
    setCurrentIndex(0);
    setSessionHistory([]);
    setFeedback(null);
    setUserAnswer('');
    setPronunciationScore(null);
    if (questions.length > 0) {
      await speak(questions[0].text);
      if (isPart2) startTimer('prep');
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setUserAnswer('');
      setPronunciationScore(null); // ← reset
      setFeedback(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
        if (isPart2 && timerPhase !== 'speak') startTimer('speak');
      } catch {}
    }
  };

  const stopListeningAndGetFeedback = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    clearInterval(timerRef.current);
    setTimerPhase(null);
    if (!userAnswer.trim()) return;

    setLoadingFeedback(true);
    setFeedback(null);

    try {
      const { data } = await getAIFeedback({
        question: questions[currentIndex].text,
        userAnswer,
        partNumber,
      });

      // pronunciationScore ni feedback ga birlashtirамiz
      const feedbackWithPronunciation = {
        ...data,
        pronunciationScore, // ← speech API dan kelgan confidence
      };

      setFeedback(feedbackWithPronunciation);
      setSessionHistory((prev) => [...prev, {
        question: questions[currentIndex].text,
        answer: userAnswer,
        feedback: feedbackWithPronunciation,
        pronunciationScore,
      }]);

      await speak(`Your estimated score is ${data.score}. Here's an improved version: ${data.improvedVersion}`);
    } catch (err) {
      if (err.response?.status === 429) {
        setFeedback({ _limitError: true, message: err.response.data.message });
      }
    }
    setLoadingFeedback(false);
  };

  const nextQuestion = async () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < questions.length) {
      setCurrentIndex(nextIdx);
      setUserAnswer('');
      setPronunciationScore(null); // ← reset
      setFeedback(null);
      setTimerPhase(null);
      clearInterval(timerRef.current);
      await speak(questions[nextIdx].text);
      if (isPart2) startTimer('prep');
    } else {
      await endSession();
    }
  };

  const endSession = async () => {
    setSessionEnded(true);
    speechSynthesis.cancel();
    clearInterval(timerRef.current);

    const answersToSave = sessionHistory.map((item) => ({
      question: item.question,
      userAnswer: item.answer,
      score: item.feedback.score,
      feedback: item.feedback.feedback,
      improvedVersion: item.feedback.improvedVersion,
    }));

    if (answersToSave.length === 0) return;
    try {
      const { data } = await saveSession({ topicId, partNumber, answers: answersToSave });
      setXpResult(data);
      await refreshUser();
    } catch (err) {
      console.error('Sessiya saqlashda xatolik:', err);
    }
  };

  const repeatQuestion = async () => {
    if (questions[currentIndex]) await speak(questions[currentIndex].text);
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ─── Boshlanmagan ──────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/speaking" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            {t('common.back')}
          </Link>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center transition-colors">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">🎤 {t('speaking.sessionTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t('common.question')} <strong>{questions.length}</strong> {t('speaking.questions')}
            </p>
            {isPart2 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4 text-left">
                <p className="text-yellow-800 dark:text-yellow-300 font-semibold mb-1">⏱ {t('speaking.part2info')}:</p>
                <ul className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
                  <li>• <strong>{t('speaking.part2min1')}</strong></li>
                  <li>• <strong>{t('speaking.part2min2')}</strong></li>
                  <li>• {t('speaking.part2auto')}</li>
                </ul>
              </div>
            )}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6 text-left">
              <p className="text-yellow-800 dark:text-yellow-300 font-semibold mb-1">⚠️ {t('speaking.preparation')}:</p>
              <ul className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
                <li>• {t('speaking.chromeTip')}</li>
                <li>• {t('speaking.micTip')}</li>
                <li>• {t('speaking.quietTip')}</li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left transition-colors">
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">{t('speaking.questionList')}:</h3>
              {questions.map((q, i) => (
                <p key={q._id} className="text-gray-700 dark:text-gray-300 mb-1 text-sm">{i + 1}. {q.text}</p>
              ))}
            </div>
            <button onClick={startSession} className="bg-blue-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-blue-700 transition-colors">
              {t('speaking.startBtn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Sessiya tugagan ───────────────────────────────────────────────────────
  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
        {xpResult && <XpPopup data={xpResult} onClose={() => setXpResult(null)} />}
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center mb-8 transition-colors">
            <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">{t('speaking.sessionEnded')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {sessionHistory.length} {t('speaking.answeredAll')}
            </p>
            <Link to="/speaking" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              {t('speaking.chooseTopic')}
            </Link>
          </div>

          {sessionHistory.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('speaking.sessionResults')}</h2>
              {sessionHistory.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 transition-colors">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">{t('common.question')} {index + 1}:</p>
                  <p className="text-gray-800 dark:text-white font-medium mb-3">{item.question}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">{t('speaking.yourAnswerLabel')}:</p>
                  <p className="text-gray-700 dark:text-gray-300 italic mb-3">"{item.answer}"</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('speaking.score')}:</span>
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold px-3 py-1 rounded-full">
                      {item.feedback.score} / 9
                    </span>
                    {item.pronunciationScore !== null && item.pronunciationScore !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        item.pronunciationScore >= 80
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                          : item.pronunciationScore >= 60
                          ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                      }`}>
                        🗣️ {item.pronunciationScore}%
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-3 transition-colors">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('speaking.feedbackTitle')}:</p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>💬 <strong>{t('speaking.fluency')}:</strong> {item.feedback.feedback?.fluency}</li>
                      <li>📚 <strong>{t('speaking.vocabulary')}:</strong> {item.feedback.feedback?.vocabulary}</li>
                      <li>✏️ <strong>{t('speaking.grammar')}:</strong> {item.feedback.feedback?.grammar}</li>
                      <li>🗣️ <strong>{t('speaking.pronunciation')}:</strong> {item.feedback.feedback?.pronunciation}</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 transition-colors">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">{t('speaking.improvedVersion')}:</p>
                    <p className="text-green-800 dark:text-green-300">"{item.feedback.improvedVersion}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Aktiv sessiya ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Link to="/speaking" className="text-blue-600 dark:text-blue-400 hover:underline">{t('common.back')}</Link>
          <button onClick={endSession} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm transition-colors">
            ⏹ {t('speaking.stopBtn')}
          </button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>{t('common.question')} {currentIndex + 1} / {questions.length}</span>
            <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Part 2 timer */}
        {isPart2 && timerPhase && (
          <Part2Timer
            phase={timerPhase}
            secondsLeft={secondsLeft}
            totalSeconds={timerPhase === 'prep' ? PREP_SECONDS : SPEAK_SECONDS}
          />
        )}

        {/* AI Examiner */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className={`text-4xl ${isSpeaking ? 'animate-bounce' : ''}`}>🤖</div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1">{t('speaking.aiExaminer')}</p>
              <p className="text-lg text-gray-800 dark:text-white font-medium">{questions[currentIndex]?.text}</p>
              {isSpeaking && (
                <p className="text-blue-500 dark:text-blue-400 text-sm mt-2 animate-pulse">{t('speaking.speaking')}</p>
              )}
            </div>
            <button
              onClick={repeatQuestion}
              disabled={isSpeaking || isListening}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 transition-colors"
              title={t('speaking.repeatBtn')}
            >
              🔄
            </button>
          </div>
        </div>

        {/* Answer area */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🙋</div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1">{t('speaking.yourAnswer')}</p>
              {userAnswer ? (
                <p className="text-gray-800 dark:text-gray-200 italic">"{userAnswer}"</p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic">
                  {isListening ? t('speaking.listening') : t('speaking.pressToSpeak')}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-center mt-6 gap-4">
            {!isListening && !feedback && (
              <button
                onClick={startListening}
                disabled={isSpeaking || loadingFeedback}
                className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-lg transition-colors"
              >
                {t('speaking.speakBtn')}
              </button>
            )}
            {isListening && (
              <button
                onClick={stopListeningAndGetFeedback}
                className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 flex items-center gap-2 text-lg animate-pulse"
              >
                {t('speaking.stopListenBtn')}
              </button>
            )}
          </div>

          {isListening && (
            <div className="flex justify-center mt-4 gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-red-500 rounded-full animate-pulse"
                  style={{ height: `${Math.random() * 25 + 10}px`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Loading feedback */}
        {loadingFeedback && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 text-center transition-colors">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">{t('speaking.aiAnalyzing')}</p>
          </div>
        )}

        {/* Limit error */}
        {feedback?._limitError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6 text-center">
            <div className="text-4xl mb-2">⛔</div>
            <p className="text-red-700 dark:text-red-400 font-semibold">{feedback.message}</p>
          </div>
        )}

        {/* Feedback */}
        {feedback && !feedback._limitError && !loadingFeedback && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('speaking.feedbackTitle')}</h3>

            {/* Ball */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-gray-600 dark:text-gray-400 font-semibold">{t('speaking.score')}:</span>
              <span className={`text-2xl font-bold px-4 py-1 rounded-full ${
                feedback.score >= 7
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                  : feedback.score >= 5.5
                  ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
              }`}>
                {feedback.score} / 9
              </span>
            </div>

            {/* Talaffuz baholash */}
            <PronunciationBar score={feedback.pronunciationScore} />

            {/* Feedback details */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 space-y-2 transition-colors">
              <p className="text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-200">💬 {t('speaking.fluency')}:</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{feedback.feedback?.fluency}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-200">📚 {t('speaking.vocabulary')}:</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{feedback.feedback?.vocabulary}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-200">✏️ {t('speaking.grammar')}:</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{feedback.feedback?.grammar}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-200">🗣️ {t('speaking.pronunciation')}:</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{feedback.feedback?.pronunciation}</span>
              </p>
            </div>

            {/* Improved version */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4 transition-colors">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">{t('speaking.improvedVersion')}:</p>
              <p className="text-green-800 dark:text-green-300 leading-relaxed">"{feedback.improvedVersion}"</p>
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={startListening}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-5 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t('speaking.retryBtn')}
              </button>
              <button
                onClick={nextQuestion}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                {currentIndex + 1 < questions.length ? t('speaking.nextBtn') : t('speaking.finishBtn')}
              </button>
            </div>
          </div>
        )}

        {/* Oldingi savollar */}
        {sessionHistory.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4">
              {t('speaking.previousQuestions')} ({sessionHistory.length})
            </h3>
            <div className="space-y-3">
              {sessionHistory.map((item, index) => (
                <details key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer transition-colors">
                  <summary className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{index + 1}. {item.question}</span>
                    <div className="flex items-center gap-2">
                      {item.pronunciationScore !== null && item.pronunciationScore !== undefined && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">🗣️ {item.pronunciationScore}%</span>
                      )}
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full text-sm">
                        {item.feedback.score}
                      </span>
                    </div>
                  </summary>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>{t('speaking.yourAnswerLabel')}:</strong> "{item.answer}"
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      <strong>{t('speaking.improvedLabel')}:</strong> "{item.feedback.improvedVersion}"
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