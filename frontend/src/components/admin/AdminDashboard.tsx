import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { axiosInstance } from '@/lib/axiosInstance';
import { UserTableRow, AdminAnalytics } from '@/types';
import { useTranslation } from '@/lib/useTranslation';

export const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuthStore();
  const { t } = useTranslation();
  
  const [users, setUsers] = useState<UserTableRow[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, analyticsRes] = await Promise.all([
          axiosInstance.get('/api/admin/users'),
          axiosInstance.get('/api/admin/analytics')
        ]);
        
        setUsers(usersRes.data.items || []);
        setAnalytics(analyticsRes.data);
      } catch (error) {
        console.error("Admin data fetch error", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await axiosInstance.put(`/api/admin/users/${userId}/deactivate`);
      } else {
        await axiosInstance.put(`/api/admin/users/${userId}/reactivate`);
      }
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
    } catch (error) {
      alert(t('operationFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-ivory">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-navy border-t-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-ivory">
      <header className="bg-brand-navy text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-light">
                <span>Fikir</span><span className="text-brand-gold font-medium">Biz</span>
              </h1>
              <span className="bg-brand-gold text-brand-navy text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                {t('admin')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
              <button 
                onClick={logout}
                className="text-brand-gray hover:text-white transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-brand-gray/30 border-l-4 border-l-brand-gold">
              <h3 className="text-sm font-medium text-brand-khaki uppercase tracking-wider">{t('totalCustomers')}</h3>
              <p className="mt-2 text-3xl font-bold text-brand-navy">{analytics.total_users}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-brand-gray/30 border-l-4 border-l-brand-green">
              <h3 className="text-sm font-medium text-brand-khaki uppercase tracking-wider">{t('todayRegistrations')}</h3>
              <p className="mt-2 text-3xl font-bold text-brand-navy">{analytics.new_users_today}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-brand-gray/30 border-l-4 border-l-[#3B82F6]">
              <h3 className="text-sm font-medium text-brand-khaki uppercase tracking-wider">{t('activeSessions')}</h3>
              <p className="mt-2 text-3xl font-bold text-brand-navy">{analytics.active_sessions_count}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-brand-gray/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-gray/30 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-brand-navy">{t('customers')}</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder={t('search')} 
                className="pl-8 pr-4 py-2 border border-brand-gray rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold"
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-2.5 text-brand-gray">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-khaki uppercase tracking-wider">{t('user')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-khaki uppercase tracking-wider">{t('registrationDate')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-khaki uppercase tracking-wider">{t('lastLogin')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-khaki uppercase tracking-wider">{t('status')}</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-khaki uppercase tracking-wider">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-brand-ivory text-brand-navy flex items-center justify-center font-bold">
                          {u.firstName[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(u.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : t('never')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.isActive ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        className={`${u.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {u.isActive ? t('deactivate') : t('reactivate')}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      {t('noCustomers')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
