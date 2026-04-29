import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPaymentStatus } from '../../services/api';
import { useTranslation } from 'react-i18next';

const TELEGRAM_LINK = 'https://t.me/Samandar_vlogs';

const PLANS = [
  {
    id: 'monthly',
    name: { uz: '1 oy', ru: '1 месяц', en: '1 month' },
    price: '49 900',
    period: { uz: 'oylik', ru: 'в месяц', en: 'monthly' },
    features: {
      uz: ['Cheksiz vocabulary qidirish', 'Cheksiz speaking sessiya', 'Haftalik mock exam cheksiz', 'Progress grafiklari', 'AI bashorat tizimi'],
      ru: ['Безлимитный поиск словаря', 'Безлимитные speaking сессии', 'Безлимитный mock exam', 'Графики прогресса', 'AI прогноз'],
      en: ['Unlimited vocabulary search', 'Unlimited speaking sessions', 'Unlimited mock exams', 'Progress charts', 'AI score prediction'],
    },
  },
  {
    id: 'quarterly',
    name: { uz: '3 oy', ru: '3 месяца', en: '3 months' },
    price: '129 900',
    period: { uz: '3 oylik', ru: 'за 3 месяца', en: '3 months' },
    features: {
      uz: ['1 oylik barcha imkoniyatlar', 'Har oyiga 43 300 so\'m', '12% tejamkor'],
      ru: ['Всё из месячного тарифа', '43 300 сум в месяц', 'Выгоднее на 12%'],
      en: ['Everything in monthly', '43,300 UZS per month', '12% cheaper'],
    },
  },
];

const COMPARISON = [
  { feature: { uz: 'Vocabulary qidirish', ru: 'Поиск словаря', en: 'Vocabulary search' }, free: { uz: '7/kun', ru: '7/день', en: '7/day' }, premium: { uz: 'Cheksiz', ru: 'Безлимит', en: 'Unlimited' } },
  { feature: { uz: 'Speaking sessiya', ru: 'Speaking сессии', en: 'Speaking sessions' }, free: { uz: '9/kun', ru: '9/день', en: '9/day' }, premium: { uz: 'Cheksiz', ru: 'Безлимит', en: 'Unlimited' } },
  { feature: { uz: 'Mock exam', ru: 'Mock экзамен', en: 'Mock exam' }, free: { uz: '1/hafta', ru: '1/неделю', en: '1/week' }, premium: { uz: 'Cheksiz', ru: 'Безлимит', en: 'Unlimited' } },
  { feature: { uz: 'Progress grafik', ru: 'График прогресса', en: 'Progress chart' }, free: '✓', premium: '✓' },
  { feature: { uz: 'AI bashorat', ru: 'AI прогноз', en: 'AI prediction' }, free: '✓', premium: '✓' },
];

const PremiumPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';

  const [premiumStatus, setPremiumStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getPaymentStatus();
        setPremiumStatus(data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const handleTelegram = () => {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    const planName = plan?.name[lang] || plan?.name.uz;
    const price = plan?.price;
    window.open(TELEGRAM_LINK, '_blank');
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(user?._id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  // Premium aktiv
  if (premiumStatus?.isPremium) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center transition-colors">
            <div className="text-6xl mb-4">👑</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {lang === 'ru' ? 'Вы Premium пользователь!' : lang === 'en' ? 'You are a Premium user!' : 'Siz Premium foydalanuvchisiz!'}
            </h1>
            {premiumStatus.expiresAt && (
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {premiumStatus.daysLeft} {lang === 'ru' ? 'дней осталось' : lang === 'en' ? 'days left' : 'kun qoldi'}
                {' '}({new Date(premiumStatus.expiresAt).toLocaleDateString()})
              </p>
            )}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
              <p className="text-green-700 dark:text-green-400 font-semibold">
                {lang === 'ru' ? 'Все функции открыты ✓' : lang === 'en' ? 'All features unlocked ✓' : 'Barcha imkoniyatlar ochiq ✓'}
              </p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              {lang === 'ru' ? 'На главную' : lang === 'en' ? 'Go to Dashboard' : 'Dashboardga qaytish'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👑</div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Premium</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {lang === 'ru' ? 'Практикуйтесь без ограничений' : lang === 'en' ? 'Practice without limits' : 'Cheksiz mashq qiling'}
          </p>
        </div>

        {/* Free vs Premium */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-6 transition-colors">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-semibold text-gray-600 dark:text-gray-400">
              {lang === 'ru' ? 'Функция' : lang === 'en' ? 'Feature' : 'Imkoniyat'}
            </div>
            <div className="text-center font-semibold text-gray-600 dark:text-gray-400">
              {lang === 'ru' ? 'Бесплатно' : lang === 'en' ? 'Free' : 'Bepul'}
            </div>
            <div className="text-center font-semibold text-blue-600 dark:text-blue-400">Premium 👑</div>

            {COMPARISON.map((row, i) => (
              <>
                <div key={`f${i}`} className="py-2 border-t border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  {typeof row.feature === 'string' ? row.feature : row.feature[lang] || row.feature.uz}
                </div>
                <div key={`fr${i}`} className="py-2 border-t border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                  {typeof row.free === 'string' ? row.free : row.free[lang] || row.free.uz}
                </div>
                <div key={`pr${i}`} className="py-2 border-t border-gray-100 dark:border-gray-700 text-center text-green-600 dark:text-green-400 font-semibold">
                  {typeof row.premium === 'string' ? row.premium : row.premium[lang] || row.premium.uz}
                </div>
              </>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-2xl p-5 text-left transition-all border-2 ${
                selectedPlan === plan.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {plan.id === 'monthly' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  {lang === 'ru' ? 'Популярный' : lang === 'en' ? 'Popular' : 'Mashhur'}
                </span>
              )}
              <p className="font-bold text-gray-800 dark:text-white mb-1">{plan.name[lang] || plan.name.uz}</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {plan.price} <span className="text-sm font-normal text-gray-500">{lang === 'ru' ? 'сум' : lang === 'en' ? 'UZS' : 'so\'m'}</span>
              </p>
              <ul className="mt-3 space-y-1">
                {(plan.features[lang] || plan.features.uz).map((f, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Telegram payment */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">t</div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white">
                {lang === 'ru' ? 'Оплата через Telegram' : lang === 'en' ? 'Pay via Telegram' : 'Telegram orqali to\'lash'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">@Samandar_vlogs</p>
            </div>
          </div>

          {/* Instruksiya */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-5 space-y-2 transition-colors">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {lang === 'ru' ? 'Как оплатить:' : lang === 'en' ? 'How to pay:' : 'Qanday to\'lash:'}
            </p>
            {[
              { uz: '1. Telegram tugmasini bosing', ru: '1. Нажмите кнопку Telegram', en: '1. Click the Telegram button' },
              { uz: '2. Tanlangan rejangizni va ID ingizni yuboring', ru: '2. Укажите выбранный тариф и ваш ID', en: '2. Send your selected plan and user ID' },
              { uz: '3. To\'lovni amalga oshiring', ru: '3. Произведите оплату', en: '3. Complete the payment' },
              { uz: '4. Admin 24 soat ichida Premium beradi', ru: '4. Админ активирует Premium в течение 24ч', en: '4. Admin activates Premium within 24h' },
            ].map((step, i) => (
              <p key={i} className="text-sm text-gray-600 dark:text-gray-400">{step[lang] || step.uz}</p>
            ))}
          </div>

          {/* User ID */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-5">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">
              {lang === 'ru' ? 'Ваш User ID (отправьте администратору):' : lang === 'en' ? 'Your User ID (send to admin):' : 'Sizning User ID (adminga yuboring):'}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-700 font-mono break-all">
                {user?._id}
              </code>
              <button
                onClick={copyUserId}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? '✓' : lang === 'ru' ? 'Копировать' : lang === 'en' ? 'Copy' : 'Nusxa'}
              </button>
            </div>
          </div>

          {/* Tanlangan reja */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-5 transition-colors">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {lang === 'ru' ? 'Выбранный тариф:' : lang === 'en' ? 'Selected plan:' : 'Tanlangan reja:'}
            </span>
            <span className="font-bold text-gray-800 dark:text-white">
              {PLANS.find((p) => p.id === selectedPlan)?.name[lang] || ''} — {PLANS.find((p) => p.id === selectedPlan)?.price} {lang === 'en' ? 'UZS' : "so'm"}
            </span>
          </div>

          <button
            onClick={handleTelegram}
            className="w-full bg-blue-500 text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-2xl">✈</span>
            {lang === 'ru' ? 'Написать в Telegram' : lang === 'en' ? 'Message on Telegram' : 'Telegramga yozish'}
          </button>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
            {lang === 'ru' ? 'После оплаты доступ открывается в течение 24 часов' : lang === 'en' ? 'Access granted within 24 hours after payment' : "To'lovdan so'ng 24 soat ichida access beriladi"}
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:underline text-center"
        >
          {lang === 'ru' ? '← Назад' : lang === 'en' ? '← Back' : '← Ortga'}
        </button>
      </div>
    </div>
  );
};

export default PremiumPage;