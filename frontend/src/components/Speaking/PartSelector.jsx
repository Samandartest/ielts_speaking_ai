import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getParts } from '../../services/api';
import { useTranslation } from 'react-i18next';

const PartSelector = () => {
  const { t } = useTranslation();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const { data } = await getParts();
        setParts(data);
      } catch (err) {
        console.error('Partlarni olishda xatolik');
      }
      setLoading(false);
    };
    fetchParts();
  }, []);

  const partColors = ['border-blue-500', 'border-yellow-500', 'border-purple-500'];
  const partEmojis = ['💬', '🗣️', '🧠'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">🎤 {t('speaking.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t('speaking.subtitle')}</p>
        <div className="grid md:grid-cols-3 gap-6">
          {parts.map((part, index) => (
            <Link
              key={part._id}
              to={`/speaking/topics/${part._id}`}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all border-l-4 ${partColors[index]}`}
            >
              <div className="text-4xl mb-3">{partEmojis[index]}</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{part.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{part.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartSelector;