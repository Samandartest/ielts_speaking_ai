import { useState, useEffect } from 'react';
import { getProgress, updateTargetBand } from '../../services/api';
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
  const [targetBand, setTargetBand] = useState(6.5);
  const [editingGoal, setEditingGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const lang = i18n.language || 'uz';

  useEffect(() => {
  const fetchData = async () => {
    try {
      const { data: res } = await getProgress();
      setData(res);
      // Faqat DB dan kelgan qiymat bo'lsa set qilish
      if (res.targetBand !== null && res.targetBand !== undefined) {
        setTargetBand(res.targetBand);
      }
    } catch {}
    setLoading(false);
  };
  fetchData();
}, []);

  const handleSaveGoal = async (band) => {
    setSavingGoal(true);
    try {
      await updateTargetBand(band);
      setTargetBand(band);
      setEditingGoal(false);
      // Progress qayta yukla
      const { data: res } = await getProgress();
      setData(res);
      if (res.targetBand) setTargetBand(res.targetBand);
    } catch (err) {
      console.error('Target band xatosi:', err);
    }
    setSavingGoal(false);
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Maqsad band */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 dark:text-white">🎯 Maqsad Band Score</h3>
          <button
            onClick={() => setEditingGoal(!editingGoal)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {editingGoal ? 'Bekor qilish' : 'O\'zgartirish'}
          </button>
        </div>

        {editingGoal ? (
          <div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5].map((band) => (
                <button
                  key={band}
                  onClick={() => handleSaveGoal(band)}
                  disabled={savingGoal}
                  className={`py-2 rounded-lg font-bold transition-colors disabled:opacity-50 ${
                    targetBand === band
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {band}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold px-6 py-3 rounded-xl ${
              targetBand >= 7
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                : targetBand >= 6
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
            }`}>
              {targetBand}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {targetBand >= 7 ? '🌟 Yuqori maqsad'
                : targetBand >= 6 ? '✅ Realistik maqsad'
                : '👍 Boshlang\'ich maqsad'}
              </p>
              {data?.prediction && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Hozirgi ball: {data.prediction.currentScore} / {targetBand} maqsad
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Haftalik grafik */}
      {data && data.sessions.length > 0 ? (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 transition-colors">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">📈 Haftalik progress</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.sessions}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis
                  domain={[0, 9]}
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v, n) => [v, n === 'avgScore' ? "O'rtacha ball" : 'Sessiyalar']}
                />
                {/* Maqsad chizig'i */}
                <ReferenceLine
                  y={targetBand}
                  stroke="#3b82f6"
                  strokeDasharray="6 3"
                  strokeOpacity={0.7}
                  label={{ value: `Maqsad ${targetBand}`, position: 'insideTopRight', fontSize: 10, fill: '#3b82f6' }}
                />
                {/* Band 6.5 chizig'i */}
                {targetBand !== 6.5 && (
                  <ReferenceLine
                    y={6.5}
                    stroke="#22c55e"
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                )}
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
            <div className="flex gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-0.5 bg-blue-500" style={{ borderTop: '2px dashed #3b82f6' }} />
                Maqsad: Band {targetBand}
              </span>
              {targetBand !== 6.5 && (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-4 h-0.5 bg-green-500" style={{ borderTop: '2px dashed #22c55e' }} />
                  Band 6.5
                </span>
              )}
            </div>
          </div>

          {/* Bashorat */}
          {data.prediction && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center transition-colors">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {data.prediction.currentScore}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Hozirgi ball</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {data.prediction.currentScore >= targetBand
                      ? '✅ Maqsadga yetdingiz!'
                      : `${(targetBand - data.prediction.currentScore).toFixed(1)} qoldi`}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center transition-colors">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {data.prediction.consistencyIndex}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Muntazamlik</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center transition-colors">
                  <div className="text-2xl font-bold text-orange-500">
                    {data.prediction.weeklySessionsAvg}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Haftalik sessiya</div>
                </div>
              </div>

              {/* Bashorat jadval */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 transition-colors">
                <h3 className="font-bold text-gray-800 dark:text-white mb-1">
                  🔮 Bashorat <TrendIcon trend={data.prediction.trend} />
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  Maqsad: Band {targetBand} · Realistic = hozirgi sur'atda · Optimal = har kuni mashq qilinsa
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '30 kun', d: data.prediction.forecast.days30 },
                    { label: '60 kun', d: data.prediction.forecast.days60 },
                    { label: '90 kun', d: data.prediction.forecast.days90 },
                  ].map(({ label, d }) => (
                    <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center transition-colors">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{label}</p>
                      <div className="flex justify-around">
                        <div>
                          <div className={`text-lg font-bold ${
                            d.realistic >= targetBand ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {d.realistic}
                          </div>
                          <div className="text-xs text-gray-400">Realistic</div>
                        </div>
                        <div className="w-px bg-gray-200 dark:bg-gray-600" />
                        <div>
                          <div className={`text-lg font-bold ${
                            d.optimal >= targetBand ? 'text-green-600 dark:text-green-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {d.optimal}
                          </div>
                          <div className="text-xs text-gray-400">Optimal</div>
                        </div>
                      </div>
                      {d.realistic >= targetBand && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">🎯 Maqsad!</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tavsiya */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 transition-colors">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">💡 Tavsiya</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {data.prediction.recommendation[lang] || data.prediction.recommendation.uz}
                </p>
                {data.prediction.daysSinceLastSession > 1 && (
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    Oxirgi mashqdan {data.prediction.daysSinceLastSession} kun o'tdi
                  </p>
                )}
              </div>
            </>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Jami {data.totalSessions} ta sessiya tahlil qilindi
          </p>
        </>
      ) : (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-3">📈</div>
          <p>Grafik uchun kamida 3 ta sessiya kerak.</p>
          <p className="text-sm mt-1">Maqsadingiz yuqorida saqlandi.</p>
        </div>
      )}
    </div>
  );
};

export default ProgressTab;