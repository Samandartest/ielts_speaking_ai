import { useState } from 'react';
import { searchVocabulary } from '../../services/api';

const VocabularySearch = () => {
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
      setError('Vocabulary olishda xatolik yuz berdi. Qayta urinib ko\'ring.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">📚 Topic Vocabulary</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic kiriting... (masalan: Technology, Education, Travel)"
            className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '⏳ Qidirilmoqda...' : '🔍 Qidirish'}
          </button>
        </form>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>
        )}

        {/* Results */}
        {vocabulary.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              "{searchedTopic}" uchun topilgan so'zlar:
            </h2>
            <div className="space-y-4">
              {vocabulary.map((item, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-5">
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{item.word}</h3>
                      <p className="text-gray-600 mt-1">
                        <span className="font-semibold">Ta'rif:</span> {item.definition}
                      </p>
                      <p className="text-blue-700 mt-1 italic">
                        <span className="font-semibold not-italic text-gray-600">Misol:</span> "{item.example}"
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