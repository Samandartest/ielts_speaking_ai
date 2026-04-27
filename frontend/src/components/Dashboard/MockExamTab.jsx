import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMockExamHistory } from '../../services/api';

const BandBadge = ({ score }) => {
  const color = score >= 7 ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
    : score >= 5.5 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
    : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
  return (
    <span className={`text-2xl font-bold px-4 py-1 rounded-full ${color}`}>
      Band {score}
    </span>
  );
};

const MockExamTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getMockExamHistory();
        setHistory(data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">🎓 Mock IELTS Speaking Exam</h2>
        <p className="text-blue-100 text-sm mb-4">
          Part 1 → Part 2 → Part 3 to'liq simulyatsiya. Oxirida real Band score chiqadi.
        </p>
        <div className="flex gap-3 text-xs text-blue-200 mb-4">
          <span>⏱ ~15 daqiqa</span>
          <span>🎤 Barcha 3 qism</span>
          <span>📊 IELTS band score</span>
        </div>
        <Link
          to="/mock-exam"
          className="inline-block bg-white text-blue-600 font-bold px-6 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Boshlash →
        </Link>
      </div>

      {/* Tarix */}
      <div>
        <h3 className="font-bold text-gray-800 dark:text-white mb-3">📋 Oldingi imtihonlar</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center text-gray-400 dark:text-gray-500 transition-colors">
            <div className="text-4xl mb-2">📝</div>
            <p>Hali mock exam yo'q. Birinchisini boshlang!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((exam) => (
              <div key={exam._id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      Mock Exam #{exam._id.slice(-4).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(exam.completedAt).toLocaleDateString()} · {exam.parts.length} qism · +{exam.xpEarned} XP
                    </p>
                    <div className="flex gap-2 mt-2">
                      {exam.parts.map((p) => (
                        <span key={p.partNumber} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                          Part {p.partNumber}: {p.averageScore}
                        </span>
                      ))}
                    </div>
                  </div>
                  <BandBadge score={exam.overallBandScore} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MockExamTab;