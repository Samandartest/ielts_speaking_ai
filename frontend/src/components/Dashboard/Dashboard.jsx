import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSessionHistory, getLeaderboard, getMyLimits } from '../../services/api';
import { useTranslation } from 'react-i18next';
import ProgressTab from './ProgressTab';
import MockExamTab from './MockExamTab';

const XP_PER_LEVEL = 100;

const getLevelProgress = (xp) => {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInCurrentLevel = xp % XP_PER_LEVEL;
  const percent = Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100);
  return { level, xpInCurrentLevel, percent };
};

const ScoreColor = ({ score }) => {
  if (score >= 7) return <span className="text-green-500 font-bold">{score}</span>;
  if (score >= 5.5) return <span className="text-yellow-500 font-bold">{score}</span>;
  return <span className="text-red-500 font-bold">{score}</span>;
};

const LimitBar = ({ label, used, limit, color }) => {
  const { t } = useTranslation();
  const remaining = limit - used;
  const percent = Math.round((used / limit) * 100);
  const barColor = remaining === 0 ? 'bg-red-500' : remaining <= 2 ? 'bg-yellow-400' : color;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`text-sm font-bold ${remaining === 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
          {remaining === 0 ? t('dashboard.limitDone') : `${remaining} ${t('dashboard.remaining')}`}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{used}/{limit} {t('dashboard.used')}</div>
    </div>
  );
};

const getMedalEmoji = (index) => {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}.`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [leaderboardType, setLeaderboardType] = useState('daily');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [limits, setLimits] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [historyRes, limitsRes] = await Promise.all([
          getSessionHistory(),
          getMyLimits(),
        ]);
        setHistory(historyRes.data);
        setLimits(limitsRes.data);
      } catch (err) {
        console.error('Ma\'lumot olishda xatolik');
      }
      setLoadingHistory(false);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const { data } = await getLeaderboard(leaderboardType);
        setLeaderboard(data.leaderboard);
      } catch (err) {
        console.error('Leaderboard xatosi');
      }
      setLoadingLeaderboard(false);
    };
    fetchLeaderboard();
  }, [leaderboardType]);

  const { level, xpInCurrentLevel, percent } = getLevelProgress(user?.xp || 0);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">

        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
          {t('dashboard.welcome')}, {user?.name}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('dashboard.subtitle')}</p>

        {/* Tabs */}
        <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 gap-1 mb-6 shadow transition-colors">
          {[
            { id: 'home', label: t('dashboard.tabHome') },
            { id: 'progress', label: t('dashboard.tabProgress') },
            { id: 'exam', label: t('dashboard.tabExam') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Progress tab */}
        {activeTab === 'progress' && <ProgressTab />}

        {/* Mock exam tab */}
        {activeTab === 'exam' && <MockExamTab />}

        {/* Home tab */}
        {activeTab === 'home' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center transition-colors">
                <div className="text-3xl mb-1">⭐</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{level}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.level')}</div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{xpInCurrentLevel}/{XP_PER_LEVEL} XP</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center transition-colors">
                <div className="text-3xl mb-1">🔥</div>
                <div className="text-2xl font-bold text-orange-500">{user?.xp || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.totalXp')}</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center transition-colors">
                <div className="text-3xl mb-1">📅</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{user?.currentStreak || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.streak')}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('dashboard.longestStreak')}: {user?.longestStreak || 0}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center transition-colors">
                <div className="text-3xl mb-1">📊</div>
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{user?.totalScore || '—'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.avgScore')}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {user?.totalSessions || 0} {t('dashboard.sessions')}
                </div>
              </div>
            </div>

            {/* Daily limits */}
            {!isAdmin && limits && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-8 transition-colors">
                <h2 className="text-base font-bold text-gray-800 dark:text-white mb-4">
                  ⚡ {t('dashboard.dailyLimit')}
                </h2>
                {limits.isPremium ? (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">👑</div>
                    <p className="font-bold text-purple-600 dark:text-purple-400 text-lg">
                      {t('dashboard.premiumUnlimited')}
                    </p>
                    {limits.premiumExpiresAt && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t('dashboard.premiumExpires')}: {new Date(limits.premiumExpiresAt).toLocaleDateString()} ({limits.daysLeft} {t('dashboard.daysLeft')})
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <LimitBar
                      label={`📚 ${t('vocab.title')}`}
                      used={limits.vocabulary.used}
                      limit={limits.vocabulary.limit}
                      color="bg-green-500"
                    />
                    <LimitBar
                      label={`🎤 ${t('speaking.title')}`}
                      used={limits.speaking.used}
                      limit={limits.speaking.limit}
                      color="bg-blue-500"
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      🔄 {t('dashboard.resetsAt')}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Action cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Link
                to="/vocabulary"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all border-l-4 border-green-500"
              >
                <div className="text-4xl mb-3">📚</div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('dashboard.vocabTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{t('dashboard.vocabDesc')}</p>
                {!isAdmin && limits && (
                  <p className="text-xs mt-2 text-green-600 dark:text-green-400 font-medium">
                    {limits.isPremium ? '∞ Cheksiz' : `${limits.vocabulary.remaining}/${limits.vocabulary.limit} ${t('dashboard.remaining')}`}
                  </p>
                )}
                <div className="mt-3 text-green-600 dark:text-green-400 font-semibold">{t('dashboard.startBtn')}</div>
              </Link>

              <Link
                to="/speaking"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all border-l-4 border-blue-500"
              >
                <div className="text-4xl mb-3">🎤</div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('dashboard.speakingTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{t('dashboard.speakingDesc')}</p>
                {!isAdmin && limits && (
                  <p className="text-xs mt-2 text-blue-600 dark:text-blue-400 font-medium">
                    {limits.isPremium ? '∞ Cheksiz' : `${limits.speaking.remaining}/${limits.speaking.limit} ${t('dashboard.remaining')}`}
                  </p>
                )}
                <div className="mt-3 text-blue-600 dark:text-blue-400 font-semibold">{t('dashboard.startBtn')}</div>
              </Link>
            </div>

            {/* Leaderboard */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-8 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-800 dark:text-white">
                  🏆 {t('dashboard.leaderboard')}
                </h2>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setLeaderboardType('daily')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      leaderboardType === 'daily'
                        ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {t('dashboard.today')}
                  </button>
                  <button
                    onClick={() => setLeaderboardType('weekly')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      leaderboardType === 'weekly'
                        ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {t('dashboard.week')}
                  </button>
                </div>
              </div>

              {loadingLeaderboard ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-sm">{t('dashboard.noLeaderboard')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => {
                    const isMe = entry._id === user?._id;
                    return (
                      <div
                        key={entry._id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isMe
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : 'bg-gray-50 dark:bg-gray-700'
                        }`}
                      >
                        <span className="text-xl w-8 text-center">{getMedalEmoji(index)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${
                            isMe ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-white'
                          }`}>
                            {entry.name}{' '}
                            {isMe && <span className="text-xs font-normal">({t('dashboard.youLabel')})</span>}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {entry.sessionCount} {t('dashboard.sessions')} · {entry.avgScore} {t('dashboard.avgScore')} · Level {entry.level}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-orange-500 font-bold">+{entry.totalXp}</span>
                          <span className="text-xs text-gray-400 ml-1">XP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Session history */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                📋 {t('dashboard.recentSessions')}
              </h2>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : history.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center text-gray-400 dark:text-gray-500 transition-colors">
                  <div className="text-4xl mb-2">🎯</div>
                  <p>{t('dashboard.noSessions')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((s) => (
                    <div
                      key={s._id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {s.topic?.name || 'Topic'}{' '}
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full ml-1">
                            Part {s.partNumber}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {new Date(s.createdAt).toLocaleDateString()} · {s.answers.length} {t('common.question')} · +{s.xpEarned} XP
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg">
                          <ScoreColor score={s.averageScore} />{' '}
                          <span className="text-gray-400 text-sm">/ 9</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Dashboard;