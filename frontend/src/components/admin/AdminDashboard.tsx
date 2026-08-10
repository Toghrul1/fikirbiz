import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { axiosInstance } from '@/lib/axiosInstance';
import { UserTableRow, PendingUserTableRow, AdminStats } from '@/types';
import { useTranslation } from '@/lib/useTranslation';

export const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuthStore();
  const { t } = useTranslation();

  const [users, setUsers] = useState<UserTableRow[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUserTableRow[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, pendingRes, statsRes] = await Promise.all([
        axiosInstance.get('/api/admin/users'),
        axiosInstance.get('/api/admin/pending-users'),
        axiosInstance.get('/api/admin/stats')
      ]);

      setUsers(usersRes.data.items || []);
      setPendingUsers(pendingRes.data.items || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Admin data fetch error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveUser = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      await axiosInstance.patch(`/api/admin/approve-user/${userId}`);
      await fetchData();
    } catch (error) {
      alert(t('operationFailed'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!window.confirm("Bu müraciəti rədd edib silmək istədiyinizdən əminsiniz?")) {
      return;
    }
    setActionLoadingId(userId);
    try {
      await axiosInstance.delete(`/api/admin/reject-user/${userId}`);
      await fetchData();
    } catch (error) {
      alert(t('operationFailed'));
    } finally {
      setActionLoadingId(null);
    }
  };

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

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/api/admin/logout');
    } catch {
      // Səhvləri ignore et (zatən çıxış edirik)
    }
    useAuthStore.getState().setUser(null);
  };

  const filteredPendingUsers = pendingUsers.filter(u =>
    !search ||
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    !search ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1220]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C9A227]/20 border-t-[#C9A227]"></div>
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Ümumi İstifadəçi',
      value: stats?.total_users ?? 0,
      accent: 'border-l-blue-500',
      valueClass: 'text-blue-400',
    },
    {
      label: 'Təsdiq Gözləyənlər',
      value: stats?.pending_users_count ?? pendingUsers.length,
      accent: 'border-l-amber-500',
      valueClass: 'text-amber-400',
      pulse: (stats?.pending_users_count ?? pendingUsers.length) > 0,
    },
    {
      label: 'Təsdiqlənmiş İstifadəçi',
      value: stats?.approved_users_count ?? 0,
      accent: 'border-l-emerald-500',
      valueClass: 'text-emerald-400',
    },
    {
      label: 'Bu Gün Qeydiyyat',
      value: stats?.new_users_today ?? 0,
      accent: 'border-l-[#C9A227]',
      valueClass: 'text-[#C9A227]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1220] font-sans text-slate-100">
      <header className="border-b border-white/[0.06] bg-[#0D1524]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C9A227]/30 bg-gradient-to-br from-[#1C2A3D] to-[#101B2A]">
                <span className="text-sm font-semibold text-[#C9A227]">
                  F<span className="text-white">B</span>
                </span>
              </div>
              <h1 className="text-lg font-medium tracking-tight text-white shrink-0">
                Admin Panel
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-md border border-[#C9A227]/25 bg-[#C9A227]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#C9A227]">
                FikirBiz
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <span className="text-xs sm:text-sm font-medium truncate max-w-[140px] sm:max-w-none text-slate-300">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-red-400/40 hover:text-red-300 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm border-l-4 ${card.accent}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {card.label}
                </h3>
                {card.pulse && (
                  <span className="flex h-3 w-3 animate-pulse rounded-full bg-amber-500"></span>
                )}
              </div>
              <p className={`mt-2 text-3xl font-bold ${card.valueClass}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>Gözləmədə Olan Müraciətlər</span>
                {pendingUsers.length > 0 && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-[#0B1220]">
                    {pendingUsers.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === 'active'
                    ? 'bg-[#C9A227]/15 text-[#C9A227]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>Təsdiqlənmiş İstifadəçilər</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-300">
                  {users.length}
                </span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('search')}
                className="w-full rounded-lg border border-white/10 bg-[#0D1524] py-2 pl-8 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 transition-all"
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-2.5 top-3 h-4 w-4 text-slate-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'pending' ? (
              <table className="min-w-full divide-y divide-white/[0.06]">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">İstifadəçi</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Müraciət Tarixi</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredPendingUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 font-bold text-amber-400">
                            {u.first_name[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-200">{u.first_name} {u.last_name}</div>
                            <div className="text-xs text-slate-500">Rol: {u.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-slate-400">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(u.registered_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold leading-5 text-amber-400">
                          Təsdiq Gözləyir
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={actionLoadingId === u.id}
                            onClick={() => handleApproveUser(u.id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {actionLoadingId === u.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Təsdiqlə
                              </>
                            )}
                          </button>

                          <button
                            disabled={actionLoadingId === u.id}
                            onClick={() => handleRejectUser(u.id)}
                            className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Rədd et
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPendingUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                        Gözləmədə olan istifadəçi müraciəti yoxdur.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-white/[0.06]">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{t('user')}</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{t('registrationDate')}</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{t('lastLogin')}</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{t('status')}</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] font-bold text-[#C9A227]">
                            {u.firstName[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-200">{u.firstName} {u.lastName}</div>
                            <div className="text-sm text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(u.registeredAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : t('never')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          u.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {u.isActive ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                          className={`${u.isActive ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                        >
                          {u.isActive ? t('deactivate') : t('reactivate')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                        {t('noCustomers')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
