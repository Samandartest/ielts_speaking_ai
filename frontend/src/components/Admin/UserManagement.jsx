import { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, deleteUser, setUserPremium, getAdminLimits, updateAdminLimits } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');

  // Limit settings
  const [limits, setLimits] = useState({ vocabulary: 7, speaking: 9 });
  const [limitsInput, setLimitsInput] = useState({ vocabulary: 7, speaking: 9 });
  const [savingLimits, setSavingLimits] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Userlarni olishda xatolik');
    }
    setLoading(false);
  };

  const fetchLimits = async () => {
    try {
      const { data } = await getAdminLimits();
      setLimits(data);
      setLimitsInput(data);
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    fetchLimits();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleRoleChange = async (userId, newRole, userName) => {
    try {
      await updateUserRole(userId, newRole);
      showMsg(`${userName} endi "${newRole}" bo'ldi!`);
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Xatolik', 'error');
    }
  };

  const handlePremiumToggle = async (userId, currentPremium, userName, months = 1) => {
    try {
      await setUserPremium(userId, !currentPremium, !currentPremium ? months : undefined);
      showMsg(`${userName} ${!currentPremium ? `Premium qilindi (${months} oy) 👑` : 'Premium bekor qilindi'}`);
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Xatolik', 'error');
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`"${userName}" ni o'chirmoqchimisiz?`)) return;
    try {
      await deleteUser(userId);
      showMsg(`${userName} o'chirildi!`);
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Xatolik', 'error');
    }
  };

  const handleSaveLimits = async () => {
    const vocab = parseInt(limitsInput.vocabulary);
    const speaking = parseInt(limitsInput.speaking);
    if (!vocab || vocab < 1 || vocab > 100 || !speaking || speaking < 1 || speaking > 100) {
      showMsg('Limitlar 1-100 oraligida bolishi kerak', 'error');
      return;
    }
    setSavingLimits(true);
    try {
      const { data } = await updateAdminLimits({ vocabulary: vocab, speaking: speaking });
      setLimits(data.limits);
      showMsg('Limitlar yangilandi ✓');
    } catch {
      showMsg('Limit saqlashda xatolik', 'error');
    }
    setSavingLimits(false);
  };

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const premiumCount = users.filter((u) => u.isPremium).length;

  return (
    <div>
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Daily Limit Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6 transition-colors">
        <h3 className="font-bold text-gray-800 dark:text-white mb-3">⚙️ Kunlik Limit Sozlamalari (Free users)</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">📚 Vocabulary (kun/user)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={limitsInput.vocabulary}
              onChange={(e) => setLimitsInput(p => ({ ...p, vocabulary: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-24 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">🎤 Speaking (kun/user)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={limitsInput.speaking}
              onChange={(e) => setLimitsInput(p => ({ ...p, speaking: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-24 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSaveLimits}
            disabled={savingLimits}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {savingLimits ? 'Saqlanmoqda...' : '💾 Saqlash'}
          </button>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Hozir: vocab={limits.vocabulary}, speaking={limits.speaking}
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          ⚠️ Bu o'zgarishlar server qayta ishga tushmagunicha saqlanadiEXPLANATION(ishlab chiqarish uchun Config modeli tavsiya etiladi)
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Email yoki ism bo'yicha qidirish..."
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
        {search && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {filteredUsers.length} ta natija topildi
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{users.length}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Jami</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">
            {users.filter((u) => u.role === 'admin').length}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Adminlar</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{premiumCount}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Premium 👑</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {users.filter((u) => u.isVerified).length}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Tasdiqlangan</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto transition-colors">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-semibold">#</th>
              <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-semibold">Ism</th>
              <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-semibold">Role</th>
              <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-semibold">Premium</th>
              <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-semibold">XP</th>
              <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-semibold">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredUsers.map((user, index) => (
              <tr
                key={user._id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  user._id === currentUser?._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{index + 1}</td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-white">{user.name}</span>
                    {user._id === currentUser?._id && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">Siz</span>
                    )}
                    {!user.isVerified && (
                      <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">⚠ Tasdiqlanmagan</span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.email}</td>

                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin'
                      ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </span>
                </td>

                <td className="px-4 py-3">
                  {user.isPremium ? (
                    <div>
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
                        💎 Premium
                      </span>
                      {user.premiumExpiresAt && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {new Date(user.premiumExpiresAt).toLocaleDateString('uz-UZ')} gacha
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">Bepul</span>
                  )}
                </td>

                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  <div className="text-xs">
                    <span className="font-semibold">{user.xp}</span> XP
                    <span className="text-gray-400 dark:text-gray-500"> · Lv{user.level}</span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  {user._id !== currentUser?._id && (
                    <div className="flex flex-wrap gap-1.5">
                      {/* Role */}
                      <button
                        onClick={() => handleRoleChange(user._id, user.role === 'admin' ? 'user' : 'admin', user.name)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          user.role === 'admin'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200'
                        }`}
                      >
                        {user.role === 'admin' ? '👤 User' : '👑 Admin'}
                      </button>

                      {/* Premium buttons */}
                      {user.isPremium ? (
                        <button
                          onClick={() => handlePremiumToggle(user._id, true, user.name)}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 hover:bg-purple-200 transition-colors"
                        >
                          💎 Off
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handlePremiumToggle(user._id, false, user.name, 1)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 hover:bg-green-200 transition-colors"
                          >
                            💎 1 oy
                          </button>
                          <button
                            onClick={() => handlePremiumToggle(user._id, false, user.name, 3)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200 transition-colors"
                          >
                            💎 3 oy
                          </button>
                        </>
                      )}

                      {/* O'chirish */}
                      <button
                        onClick={() => handleDelete(user._id, user.name)}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 hover:bg-red-200 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
