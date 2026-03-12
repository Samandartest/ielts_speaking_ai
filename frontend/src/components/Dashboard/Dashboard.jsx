import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Xush kelibsiz, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mb-8">
          IELTS Speaking imtihoniga tayyorlanish uchun quyidagi bo'limlardan birini tanlang.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Vocabulary Section */}
          <Link
            to="/vocabulary"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <div className="text-4xl mb-3">📚</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Topic Vocabulary
            </h2>
            <p className="text-gray-600">
              Istalgan topicni kiriting va IELTS speaking uchun kerakli
              vocabulary so'zlarni oling. Har bir so'z definition va example
              bilan keladi.
            </p>
            <div className="mt-4 text-green-600 font-semibold">
              Boshlash →
            </div>
          </Link>

          {/* Speaking Section */}
          <Link
            to="/speaking"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500"
          >
            <div className="text-4xl mb-3">🎤</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Speaking Practice
            </h2>
            <p className="text-gray-600">
              Part 1, 2 yoki 3 ni tanlang. AI bilan real-time suhbat qiling.
              Har bir javobingizga feedback va improved version oling.
            </p>
            <div className="mt-4 text-blue-600 font-semibold">
              Boshlash →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;