import { useState } from 'react';
import UserManagement from './UserManagement';
import TopicManagement from './TopicManagement';
import { useTranslation } from 'react-i18next';

const AdminPanel = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: t('admin.users'), color: 'blue' },
    { id: 'topics', label: t('admin.topics'), color: 'green' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🛠️ Admin Panel</h1>
          <p className="text-gray-600 mt-1">
            {t('admin.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${
                activeTab === tab.id
                  ? `bg-${tab.color}-600 text-white shadow-md`
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'topics' && <TopicManagement />}
      </div>
    </div>
  );
};

export default AdminPanel;