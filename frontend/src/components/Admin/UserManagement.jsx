import { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, deleteUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      const { data } = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Userlarni olishda xatolik');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole, userName) => {
    try {
      await updateUserRole(userId, newRole);
      setMessage({
        text: `${userName} endi "${newRole}" bo'ldi!`,
        type: 'success',
      });
      fetchUsers();
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Xatolik yuz berdi',
        type: 'error',
      });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleDelete = async (userId, userName) => {
    const confirmed = window.confirm(
      `"${userName}" ni o'chirmoqchimisiz? Bu qaytarilmaydi!`
    );
    if (!confirmed) return;

    try {
      await deleteUser(userId);
      setMessage({ text: `${userName} o'chirildi!`, type: 'success' });
      fetchUsers();
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Xatolik yuz berdi',
        type: 'error',
      });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Message */}
      {message.text && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{users.length}</p>
          <p className="text-gray-500 text-sm">Jami userlar</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">
            {users.filter((u) => u.role === 'admin').length}
          </p>
          <p className="text-gray-500 text-sm">Adminlar</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {users.filter((u) => u.role === 'user').length}
          </p>
          <p className="text-gray-500 text-sm">Oddiy userlar</p>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                #
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                Ism
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                Role
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                Ro'yxatdan o'tgan
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user, index) => (
              <tr
                key={user._id}
                className={`hover:bg-gray-50 ${
                  user._id === currentUser?._id ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-3 text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {user.name}
                    </span>
                    {user._id === currentUser?._id && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        Siz
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      user.role === 'admin'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                </td>
                <td className="px-4 py-3">
                  {user._id !== currentUser?._id && (
                    <div className="flex gap-2">
                      {/* Role o'zgartirish */}
                      <button
                        onClick={() =>
                          handleRoleChange(
                            user._id,
                            user.role === 'admin' ? 'user' : 'admin',
                            user.name
                          )
                        }
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {user.role === 'admin'
                          ? '👤 User qilish'
                          : '👑 Admin qilish'}
                      </button>

                      {/* O'chirish */}
                      <button
                        onClick={() => handleDelete(user._id, user.name)}
                        className="px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        🗑️ O'chirish
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