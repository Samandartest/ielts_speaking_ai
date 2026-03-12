import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-700 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          🎤 IELTS Speaking AI
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link>
              <Link to="/vocabulary" className="hover:text-blue-200">Vocabulary</Link>
              <Link to="/speaking" className="hover:text-blue-200">Speaking</Link>

              {/* Faqat admin ko'radi */}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="hover:text-blue-200 bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold"
                >
                  ⚙️ Admin
                </Link>
              )}

              <span className="text-blue-200">Salom, {user.name}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
              >
                Chiqish
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200">Kirish</Link>
              <Link to="/register" className="bg-white text-blue-700 px-3 py-1 rounded hover:bg-blue-100">
                Ro'yxatdan o'tish
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;