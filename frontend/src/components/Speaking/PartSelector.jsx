import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getParts } from '../../services/api';

const PartSelector = () => {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🎤 Speaking Practice</h1>
        <p className="text-gray-600 mb-8">Qaysi part ni mashq qilmoqchisiz?</p>

        <div className="grid md:grid-cols-3 gap-6">
          {parts.map((part, index) => (
            <Link
              key={part._id}
              to={`/speaking/topics/${part._id}`}
              className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 ${partColors[index]}`}
            >
              <div className="text-4xl mb-3">{partEmojis[index]}</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{part.title}</h2>
              <p className="text-gray-600 text-sm">{part.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartSelector;