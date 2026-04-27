import { useState, useEffect } from 'react';
import { getProgress } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const TrendIcon = ({ trend }) => {
  if (trend === 'rising') return <span className="text-green-500">↑</span>;
  if (trend === 'falling') return <span className="text-red-500">↓</span>;
  return <span className="text-yellow-500">→</span>;
};

const ProgressTab = () => {
  const { i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language || 'uz';

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await getProgress();
        setData(res);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (!data || data.sessions.length === 0) return (
    <div className="text-center py-12 text-gray-400 dark:text-gray-500">
      <div className="text-4xl mb-3">📈</div>
      <p>Grafik uchun kamida 3 ta sessiya kerak.</p>
    </div>
  );

  const { sessions, prediction, totalSessions } = data;

  return (
    <div className="space-y-6">

      {/* Haftalik grafik */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 transition-colors">
        <h3 className="font-bold text-gray-800 dark:text-white mb-4">📈 Haftalik progress</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={sessions}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              tickFormatter={(d) => d.slice(5)}
            />
            <YAxis domain={[0, 9]} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border-tertiary)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v, n) => [v, n === 'avgScore' ? "O'rtacha ball" : 'Sessiyalar']}
            />
            <ReferenceLine y={6.5} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
          Yashil chiziq = IELTS Band 6.5 maqsad
        </p>
      </div>

      {/* Bashorat — faqat yetarli data bo'lsa */}
      {prediction && (
        <>
          {/* Consistency va holat */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center transition-colors">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {prediction.currentScore}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Hozirgi ball</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center transition-colors">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {prediction.consistencyIndex}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Muntazamlik</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center transition-colors">
              <div className="text-2xl font-bold text-orange-500">
                {prediction.weeklySessionsAvg}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Haftalik sessiya</div>
            </div>
          </div>

          {/* Bashorat jadval */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 transition-colors">
            <h3 className="font-bold text-gray-800 dark:text-white mb-1">
              🔮 Bashorat <TrendIcon trend={prediction.trend} />
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Realistic = hozirgi sur'atda · Optimal = har kuni mashq qilinsa
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '30 kun', data: prediction.forecast.days30 },
                { label: '60 kun', data: prediction.forecast.days60 },
                { label: '90 kun', data: prediction.forecast.days90 },
              ].map(({ label, data: d }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center transition-colors">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{label}</p>
                  <div className="flex justify-around">
                    <div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{d.realistic}</div>
                      <div className="text-xs text-gray-400">Realistic</div>
                    </div>
                    <div className="w-px bg-gray-200 dark:bg-gray-600" />
                    <div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">{d.optimal}</div>
                      <div className="text-xs text-gray-400">Optimal</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tavsiya */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 transition-colors">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">💡 Tavsiya</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {prediction.recommendation[lang] || prediction.recommendation.uz}
            </p>
            {prediction.daysSinceLastSession > 1 && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                Oxirgi mashqdan {prediction.daysSinceLastSession} kun o'tdi
              </p>
            )}
          </div>
        </>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Jami {totalSessions} ta sessiya tahlil qilindi
      </p>
    </div>
  );
};

export default ProgressTab;