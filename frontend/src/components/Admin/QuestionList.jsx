import { deleteQuestion } from '../../services/api';

const QuestionList = ({ questions, topicName, onQuestionDeleted }) => {
  const handleDelete = async (questionId) => {
    const confirmed = window.confirm('Bu savolni o\'chirmoqchimisiz?');
    if (!confirmed) return;

    try {
      await deleteQuestion(questionId);
      onQuestionDeleted();
    } catch (err) {
      console.error("O'chirishda xatolik");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          ❓ "{topicName}" savollari
        </h3>
        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-semibold">
          {questions.length} ta
        </span>
      </div>

      {questions.length === 0 ? (
        <p className="text-gray-400 italic">Savollar yo'q. Qo'shing!</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q, index) => (
            <div
              key={q._id}
              className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 group"
            >
              <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full text-xs mt-0.5">
                {index + 1}
              </span>
              <p className="text-gray-700 text-sm flex-1">{q.text}</p>
              <button
                onClick={() => handleDelete(q._id)}
                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
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

export default QuestionList;