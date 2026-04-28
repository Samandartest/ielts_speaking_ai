import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { register, verifyEmail } from '../../services/api';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();

  const [step, setStep] = useState('form'); // 'form' | 'goal' | 'verify'
  const [targetBand, setTargetBand] = useState(6.5);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Avval goal sahifaga o'tamiz
      setStep('goal');
    } catch (err) {
      setError(err.response?.data?.message || 'Xatolik');
    }
    setLoading(false);
  };

  const handleGoalAndRegister = async () => {
    setLoading(true);
    setError('');
    try {
      await register({ name, email, password, targetBand });
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Xatolik');
      setStep('form');
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await verifyEmail({ email, code });
      loginUser(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Xatolik');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await register({ name, email, password, targetBand });
    } catch {}
    setResending(false);
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md transition-colors">

        {step === 'form' ? (
          <>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
              {t('auth.register')}
            </h1>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
              >
                {loading ? t('auth.sending') : t('auth.continue')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </>
        ) : step === 'goal' ? (
          <div className="text-center">
            <div className="text-5xl mb-3">🎯</div>

            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Maqsadingiz nima?
            </h1>

            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              IELTS Speaking da qanday band scorega erishmoqchisiz?
            </p>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5].map((band) => (
                <button
                  key={band}
                  onClick={() => setTargetBand(band)}
                  className={`py-3 rounded-xl font-bold text-lg transition-colors ${
                    targetBand === band
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {band}
                </button>
              ))}
            </div>

            <div className={`p-3 rounded-lg mb-6 text-sm ${
              targetBand >= 7
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : targetBand >= 6
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
            }`}>
              {targetBand >= 7
                ? "🌟 Yuqori maqsad! Ko'p mashq kerak bo'ladi"
                : targetBand >= 6
                ? '✅ Realistik maqsad!'
                : "👍 Boshlang'ich maqsad, keyin oshirishingiz mumkin"}
            </div>

            <button
              onClick={handleGoalAndRegister}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Yuborilmoqda...' : `Band ${targetBand} maqsadim bilan davom etish →`}
            </button>

            <button
              onClick={() => setStep('form')}
              className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:underline w-full text-center"
            >
              ← Orqaga
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📧</div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {t('auth.verifyTitle')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {email}
                </span>{' '}
                {t('auth.verifyDesc')}
              </p>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder={t('auth.codePlaceholder')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
              >
                {loading ? t('auth.checking') : t('auth.confirm')}
              </button>
            </form>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setStep('form')}
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
              >
                {t('auth.back')}
              </button>

              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
              >
                {resending ? t('auth.sending') : t('auth.resendCode')}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Register;