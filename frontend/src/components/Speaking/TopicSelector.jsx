import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTopics } from '../../services/api';

const TopicSelector = () => {
  const { partId } = useParams();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data } = await getTopics(partId);
        setTopics(data);
      } catch (err) {
        console.error('Topiclarni olishda xatolik');
      }
      setLoading(false);
    };
    fetchTopics();
  }, [partId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/speaking" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Ortga
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Topic tanlang</h1>

        <div className="grid md:grid-cols-2 gap-4">
          {topics.map((topic) => (
            <Link
              key={topic._id}
              to={`/speaking/session/${topic._id}`}
              className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition-shadow hover:bg-blue-50"
            >
              <h3 className="text-lg font-semibold text-gray-800">📌 {topic.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicSelector;