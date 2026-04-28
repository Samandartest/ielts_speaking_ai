import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPaymentStatus } from '../../services/api';

const PLANS = [
  {
    id: 'monthly',
    name: '1 oy',
    price: '49 900',
    priceNum: 49900,
    period: 'oylik',
    popular: true,
    features: [
      'Cheksiz vocabulary qidirish',
      'Cheksiz speaking sessiya',
      'Mock exam cheksiz',
      'Progress grafiklari',
      'Bashorat tizimi',
    ],
  },
  {
    id: 'quarterly',
    name: '3 oy',
    price: '129 900',
    priceNum: 129900,
    period: '3 oylik',
    popular: false,
    features: [
      'Hammasi + 3 oylik chegirma',
      'Har oyiga 43 300 so\'m',
      '12% tejamkor',
    ],
  },
];

const PremiumPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

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

  const handlePayme = () => {
    const amount = selectedPlan === 'monthly' ? 4990000 : 12990000; // tiyin
    const orderId = `${user._id}_${Date.now()}`;
    const merchant = process.env.REACT_APP_PAYME_MERCHANT_ID || 'your_merchant_id';
    const callbackUrl = encodeURIComponent(`${window.location.origin}/dashboard`);

    const url = `https://checkout.paycom.uz/${btoa(
      `m=${merchant};ac.user_id=${user._id};a=${amount};l=uz;c=${callbackUrl}`
    )}`;
    window.open(url, '_blank');
  };

  const handleClick = () => {
    const amount = selectedPlan === 'monthly' ? 49900 : 129900;
    const serviceId = process.env.REACT_APP_CLICK_SERVICE_ID || 'your_service_id';
    const merchantTransId = user._id;
    const returnUrl = encodeURIComponent(`${window.location.origin}/dashboard`);

    const url = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${serviceId}&amount=${amount}&transaction_param=${merchantTransId}&return_url=${returnUrl}`;
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  // Premium aktiv bo'lsa
  if (premiumStatus?.isPremium) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center transition-colors">
            <div className="text-5xl mb-4">👑</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Siz Premium foydalanuvchisiz!
            </h1>
            {premiumStatus.expiresAt && (
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {premiumStatus.daysLeft} kun qoldi ({new Date(premiumStatus.expiresAt).toLocaleDateString()})
              </p>
            )}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
              <p className="text-green-700 dark:text-green-400 font-semibold">
                Barcha imkoniyatlar ochiq ✓
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Dashboardga qaytish
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
            Cheksiz mashq qiling — maqsadingizga tezroq yeting
          </p>
        </div>

        {/* Free vs Premium comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-6 transition-colors">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-semibold text-gray-600 dark:text-gray-400">Imkoniyat</div>
            <div className="text-center font-semibold text-gray-600 dark:text-gray-400">Bepul</div>
            <div className="text-center font-semibold text-blue-600 dark:text-blue-400">Premium 👑</div>

            {[
              ['Vocabulary qidirish', '7/kun', 'Cheksiz'],
              ['Speaking sessiya', '9/kun', 'Cheksiz'],
              ['Mock exam', '9/kun', 'Cheksiz'],
              ['Progress grafik', '✓', '✓'],
              ['AI bashorat', '✓', '✓'],
              ['Reklamasiz', '✓', '✓'],
            ].map(([feature, free, premium]) => (
              <>
                <div key={feature} className="py-2 border-t border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300">{feature}</div>
                <div className="py-2 border-t border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">{free}</div>
                <div className="py-2 border-t border-gray-100 dark:border-gray-700 text-center text-green-600 dark:text-green-400 font-semibold">{premium}</div>
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
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  Mashhur
                </span>
              )}
              <p className="font-bold text-gray-800 dark:text-white mb-1">{plan.name}</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {plan.price} <span className="text-sm font-normal text-gray-500">so'm</span>
              </p>
              <ul className="mt-3 space-y-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Payment buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 transition-colors">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            To'lov tizimini tanlang
          </p>
          <div className="space-y-3">
            <button
              onClick={handlePayme}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 text-lg"
            >
              <span className="bg-white text-blue-600 px-2 py-0.5 rounded font-black text-sm">Payme</span>
              orqali to'lash
            </button>
            <button
              onClick={handleClick}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-3 text-lg"
            >
              <span className="bg-white text-green-600 px-2 py-0.5 rounded font-black text-sm">Click</span>
              orqali to'lash
            </button>
          </div>
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
            To'lov xavfsiz SSL orqali amalga oshiriladi
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:underline text-center"
        >
          ← Dashboardga qaytish
        </button>
      </div>
    </div>
  );
};

export default PremiumPage;