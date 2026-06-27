import { Outlet } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useLanguageStore } from '@/store/languageStore';

function App() {
  const { language, setLanguage } = useLanguageStore();

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
      <header className="relative z-20 flex items-center justify-end p-4">
        <LanguageSwitcher value={language} onChange={setLanguage} />
      </header>
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  )
}

export default App
