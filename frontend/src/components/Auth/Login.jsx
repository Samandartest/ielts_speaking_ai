import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login, verifyEmail, forgotPassword, resetPassword } from '../../services/api';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      const { data } = await login({ email, password });
      loginUser(data);
      navigate('/dashboard');
    } catch (err) {
      const res = err.response?.data;
      if (res?.requireVerification) {
        setStep('verify');
      } else {
        setError(res?.message || 'Xatolik');
      }
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      const { data } = await verifyEmail({ email, code });
      loginUser(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Xatolik');
    }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      await forgotPassword({ email });
      setSuccess(t('auth.resetDesc'));
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Xatolik');
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      await resetPassword({ email, code, newPassword });
      setStep('login');
      setCode('');
      setNewPassword('');
      setSuccess('Parol yangilandi!');
    } catch (err) {
      setError(err.response?.data?.message || 'Xatolik');
    }
    setLoading(false);
  };

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md transition-colors">

        {step === 'login' && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">{t('auth.login')}</h1>
            {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            {success && <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded-lg mb-4 text-sm">{success}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.password')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required />
              </div>
              <div className="text-right">
                <button type="button" onClick={() => { clearMessages(); setStep('forgot'); }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors">
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </button>
            </form>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">{t('auth.register')}</Link>
            </p>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📧</div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('auth.verifyTitle')}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                <span className="font-medium text-blue-600 dark:text-blue-400">{email}</span> {t('auth.verifyDesc')}
              </p>
            </div>
            {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('auth.codePlaceholder')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
              <button type="submit" disabled={loading || code.length !== 6} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors">
                {loading ? t('auth.checking') : t('auth.confirm')}
              </button>
            </form>
            <button onClick={() => { clearMessages(); setStep('login'); }} className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:underline w-full text-center">
              {t('auth.back')}
            </button>
          </>
        )}

        {step === 'forgot' && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔐</div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('auth.resetTitle')}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{t('auth.resetDesc')}</p>
            </div>
            {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors">
                {loading ? t('auth.sending') : t('auth.sendCode')}
              </button>
            </form>
            <button onClick={() => { clearMessages(); setStep('login'); }} className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:underline w-full text-center">
              {t('auth.backToLogin')}
            </button>
          </>
        )}

        {step === 'reset' && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔑</div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('auth.newPassword')}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                <span className="font-medium text-blue-600 dark:text-blue-400">{email}</span> {t('auth.verifyDesc')}
              </p>
            </div>
            {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            {success && <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded-lg mb-4 text-sm">{success}</div>}
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.codePlaceholder')}</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('auth.codePlaceholder')}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.newPassword')}</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} required minLength={6} />
              </div>
              <button type="submit" disabled={loading || code.length !== 6} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors">
                {loading ? t('auth.saving') : t('auth.updatePassword')}
              </button>
            </form>
            <button onClick={() => { clearMessages(); setStep('forgot'); }} className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:underline w-full text-center">
              {t('auth.back')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;