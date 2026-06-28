import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';

function App() {
  const { language, setLanguage } = useLanguageStore();
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-brand-ivory font-sans text-brand-navy">
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Inter,system-ui,sans-serif' font-size='48' font-weight='700' letter-spacing='8' fill='%230D1B2A' fill-opacity='0.04' transform='rotate(-30 200 150)'%3EFikirBiz%3C/text%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      <header className="relative z-20 flex items-center justify-end gap-3 p-4">
        <LanguageSwitcher value={language} onChange={setLanguage} />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-brand-gray rounded-xl text-sm text-brand-navy hover:border-red-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  )
}

export default App
