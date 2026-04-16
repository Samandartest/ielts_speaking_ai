import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'uz', label: "O'Z" },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
          🎤 {t('nav.brand')}
        </Link>

        <div className="flex items-center gap-2">

          {/* Til tanlash */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 gap-0.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 text-base"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">{user.name}</span>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                  {t('nav.admin')}
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                {t('auth.login')}
              </Link>
              <Link to="/register" className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                {t('auth.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;