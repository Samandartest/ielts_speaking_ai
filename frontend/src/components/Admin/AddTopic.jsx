import { useState } from 'react';
import { addNewTopic } from '../../services/api';

const AddTopic = ({ selectedPart, onTopicAdded }) => {
  const [topicName, setTopicName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topicName.trim()) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { data } = await addNewTopic({
        name: topicName.trim(),
        partNumber: selectedPart.partNumber,
      });

      setMessage({ text: data.message, type: 'success' });
      setTopicName('');
      onTopicAdded(); // Ro'yxatni yangilash
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Xatolik yuz berdi',
        type: 'error',
      });
    }

    setLoading(false);
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow p-5 mb-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3">
        ➕ Yangi Topic qo'shish (Part {selectedPart?.partNumber})
      </h3>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          placeholder="Topic nomi... (masalan: Travel)"
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
        >
          {loading ? '⏳' : '➕ Qo\'shish'}
        </button>
      </form>

      {message.text && (
        <div
          className={`mt-3 p-2 rounded text-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};

export default AddTopic;