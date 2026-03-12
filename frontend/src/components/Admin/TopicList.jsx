import { deleteTopic } from '../../services/api';

const TopicList = ({ topics, selectedTopic, onSelectTopic, onTopicDeleted }) => {
  const handleDelete = async (topic) => {
    const confirmed = window.confirm(
      `"${topic.name}" topicni va uning barcha savollarini o'chirmoqchimisiz?`
    );
    if (!confirmed) return;

    try {
      await deleteTopic(topic._id);
      onTopicDeleted();
    } catch (err) {
      console.error('O\'chirishda xatolik');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="text-lg font-bold text-gray-800 mb-3">
        📌 Topiclar ({topics.length})
      </h3>

      {topics.length === 0 ? (
        <p className="text-gray-400 italic">Topiclar yo'q. Qo'shing!</p>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <div
              key={topic._id}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                selectedTopic?._id === topic._id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <span
                onClick={() => onSelectTopic(topic)}
                className="flex-1 text-gray-800 font-medium"
              >
                📌 {topic.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(topic);
                }}
                className="text-red-400 hover:text-red-600 ml-2 text-sm"
                title="O'chirish"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicList;