import { useState } from 'react';
import { searchVocabulary } from '../../services/api';
import { useTranslation } from 'react-i18next';

const VocabularySearch = () => {
  const { t } = useTranslation();
  const [topic, setTopic] = useState('');
  const [vocabulary, setVocabulary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchedTopic, setSearchedTopic] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    setVocabulary([]);
    try {
      const { data } = await searchVocabulary(topic);
      setVocabulary(data.vocabulary);
      setSearchedTopic(data.topic);
    } catch (err) {
      if (err.response?.status === 429) {
        setError(t('vocab.limitError'));
      } else {
        setError(t('vocab.error'));
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{t('vocab.title')}</h1>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('vocab.placeholder')}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          />
          <button type="submit" disabled={loading} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            {loading ? t('vocab.searching') : t('vocab.searchBtn')}
          </button>
        </form>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">{error}</div>
        )}

        {vocabulary.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
              "{searchedTopic}" {t('vocab.resultsFor')}:
            </h2>
            <div className="space-y-4">
              {vocabulary.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 font-bold px-3 py-1 rounded-full text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{item.word}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-semibold">{t('vocab.definition')}:</span> {item.definition}
                      </p>
                      <p className="text-blue-700 dark:text-blue-400 mt-1 italic">
                        <span className="font-semibold not-italic text-gray-600 dark:text-gray-400">{t('vocab.example')}:</span> "{item.example}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularySearch;