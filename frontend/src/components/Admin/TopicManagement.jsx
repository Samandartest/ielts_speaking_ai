import { useState, useEffect } from 'react';
import { getParts, getTopics, getQuestions } from '../../services/api';
import AddTopic from './AddTopic';
import AddQuestion from './AddQuestion';
import TopicList from './TopicList';
import QuestionList from './QuestionList';

const TopicManagement = () => {
  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const { data } = await getParts();
        setParts(data);
        if (data.length > 0) setSelectedPart(data[0]);
      } catch (err) {
        console.error('Partlarni olishda xatolik');
      }
      setLoading(false);
    };
    fetchParts();
  }, []);

  useEffect(() => {
    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPart]);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic]);

  const fetchTopics = async () => {
    try {
      const { data } = await getTopics(selectedPart._id);
      setTopics(data);
      setSelectedTopic(null);
      setQuestions([]);
    } catch (err) {
      console.error('Topiclarni olishda xatolik');
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data } = await getQuestions(selectedTopic._id);
      setQuestions(data);
    } catch (err) {
      console.error('Savollarni olishda xatolik');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Part tanlash */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <p className="text-sm font-semibold text-gray-600 mb-3">Part tanlang:</p>
        <div className="flex gap-3">
          {parts.map((part) => (
            <button
              key={part._id}
              onClick={() => setSelectedPart(part)}
              className={`px-5 py-2 rounded-lg font-semibold transition-colors ${
                selectedPart?._id === part._id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Part {part.partNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{topics.length}</p>
          <p className="text-gray-500 text-sm">
            Part {selectedPart?.partNumber} topiclar
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{questions.length}</p>
          <p className="text-gray-500 text-sm">
            {selectedTopic ? `"${selectedTopic.name}" savollari` : 'Topic tanlang'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* CHAP — Topiclar */}
        <div>
          <AddTopic selectedPart={selectedPart} onTopicAdded={fetchTopics} />
          <TopicList
            topics={topics}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
            onTopicDeleted={fetchTopics}
          />
        </div>

        {/* O'NG — Savollar */}
        <div>
          {selectedTopic ? (
            <>
              <AddQuestion
                selectedTopic={selectedTopic}
                selectedPart={selectedPart}
                onQuestionAdded={fetchQuestions}
              />
              <QuestionList
                questions={questions}
                topicName={selectedTopic.name}
                onQuestionDeleted={fetchQuestions}
              />
            </>
          ) : (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-gray-400 text-lg">👈 Topic tanlang</p>
              <p className="text-gray-300 text-sm mt-1">
                Savollarni ko'rish va qo'shish uchun
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicManagement;