import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTopics, getParts } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const TopicSelector = () => {
  const { partId } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [partNumber, setPartNumber] = useState(1);
  const [loading, setLoading] = useState(true);

  const completedSet = new Set(
    (user?.completedTopics || []).map((t) => t._id || t.toString())
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, partsRes] = await Promise.all([getTopics(partId), getParts()]);
        setTopics(topicsRes.data);
        const part = partsRes.data.find((p) => p._id === partId);
        if (part) setPartNumber(part.partNumber);
      } catch (err) {
        console.error('Topiclarni olishda xatolik');
      }
      setLoading(false);
    };
    fetchData();
  }, [partId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const completedCount = topics.filter((t) => completedSet.has(t._id)).length;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/speaking" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
          {t('common.back')}
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{t('speaking.selectTopic')}</h1>
        <div className="flex items-center gap-3 mb-6">
          <p className="text-gray-500 dark:text-gray-400">Part {partNumber}</p>
          {completedCount > 0 && (
            <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
              ✓ {completedCount}/{topics.length} {t('speaking.completed')}
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {topics.map((topic) => {
            const isDone = completedSet.has(topic._id);
            return (
              <Link
                key={topic._id}
                to={`/speaking/session/${topic._id}`}
                state={{ partNumber }}
                className={`relative rounded-lg shadow p-5 transition-all
                  ${isDone
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:shadow-md'
                    : 'bg-white dark:bg-gray-800 hover:shadow-lg hover:bg-blue-50 dark:hover:bg-gray-700'
                  }`}
              >
                {isDone && (
                  <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    ✓
                  </span>
                )}
                <h3 className={`text-lg font-semibold pr-8 ${isDone ? 'text-green-800 dark:text-green-300' : 'text-gray-800 dark:text-white'}`}>
                  📌 {topic.name}
                </h3>
                {isDone ? (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ {t('speaking.completed')} — qayta mashq qilish mumkin
                  </p>
                ) : partNumber === 2 ? (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    ⏱ {t('speaking.part2min1')} + {t('speaking.part2min2')}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopicSelector;