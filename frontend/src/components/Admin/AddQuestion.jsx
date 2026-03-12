import { useState } from 'react';
import { addNewQuestion } from '../../services/api';

const AddQuestion = ({ selectedTopic, selectedPart, onQuestionAdded }) => {
  const [questionText, setQuestionText] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Bitta savol qo'shish
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { data } = await addNewQuestion({
        topicName: selectedTopic.name,
        partNumber: selectedPart.partNumber,
        questions: [questionText.trim()],
      });

      setMessage({ text: data.message, type: 'success' });
      setQuestionText('');
      onQuestionAdded();
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Xatolik yuz berdi',
        type: 'error',
      });
    }

    setLoading(false);
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Ko'p savol bir vaqtda qo'shish
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    // Har bir qatorni alohida savol sifatida olish
    const questions = bulkText
      .split('\n')
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    if (questions.length === 0) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { data } = await addNewQuestion({
        topicName: selectedTopic.name,
        partNumber: selectedPart.partNumber,
        questions: questions,
      });

      setMessage({ text: data.message, type: 'success' });
      setBulkText('');
      onQuestionAdded();
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
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-gray-800">
          ➕ Savol qo'shish → "{selectedTopic.name}"
        </h3>
        <button
          onClick={() => setBulkMode(!bulkMode)}
          className="text-sm text-blue-600 hover:underline"
        >
          {bulkMode ? '☝️ Bitta savol' : '📋 Ko\'p savol'}
        </button>
      </div>

      {!bulkMode ? (
        // Bitta savol
        <form onSubmit={handleSingleSubmit} className="flex gap-2">
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Savol yozing... (masalan: Do you like music?)"
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
          >
            {loading ? '⏳' : '➕'}
          </button>
        </form>
      ) : (
        // Ko'p savol
        <form onSubmit={handleBulkSubmit}>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Har bir savolni yangi qatorga yozing:&#10;What is your favorite color?&#10;Do you like reading books?&#10;How often do you exercise?"
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-y"
            required
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-400">
              {bulkText.split('\n').filter((q) => q.trim()).length} ta savol
            </span>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
            >
              {loading ? '⏳ Qo\'shilmoqda...' : '➕ Hammasini qo\'shish'}
            </button>
          </div>
        </form>
      )}

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

export default AddQuestion;