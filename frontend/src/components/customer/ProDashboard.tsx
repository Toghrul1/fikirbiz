import { useState } from 'react';
import { ContentGenerator } from '../content/ContentGenerator';
import { useAppStore } from '@/store/appStore';
import { CanvaLogo, CanvaPoweredBy } from '../canva/CanvaLogo';
import { useTranslation } from '@/lib/useTranslation';

export function ProDashboard() {
  const [activeTab, setActiveTab] = useState<'content' | 'canva'>('content');
  const {
    connector,
    initiateCanvaAuth,
    disconnectCanva,
    designs,
  } = useAppStore();
  const { t } = useTranslation();

  const handleCanvaToggle = () => {
    if (connector.status === 'connected') {
      disconnectCanva();
    } else {
      initiateCanvaAuth();
    }
  };

  return (
    <div className="min-h-screen bg-brand-ivory">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">
            💼 FikirBiz Pro
          </h1>
          <p className="text-brand-khaki">
            {t('contentDesc')}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'content'
                ? 'bg-brand-navy text-brand-gold shadow-lg shadow-brand-navy/15'
                : 'bg-white text-brand-khaki hover:bg-brand-gray/30 border border-brand-gray'
            }`}
          >
            ✨ {t('contentTitle')}
          </button>
          <button
            onClick={() => setActiveTab('canva')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'canva'
                ? 'bg-brand-navy text-brand-gold shadow-lg shadow-brand-navy/15'
                : 'bg-white text-brand-khaki hover:bg-brand-gray/30 border border-brand-gray'
            }`}
          >
            🎨 Canva Connect
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'content' && <ContentGenerator />}

        {activeTab === 'canva' && (
          <div className="bg-white rounded-2xl shadow-lg border border-brand-gray p-6">
            <div className="flex items-center justify-between mb-4">
              <CanvaLogo size="md" />
              <div className={`flex items-center gap-1.5 text-sm ${
                connector.status === 'connected' ? 'text-green-600' :
                connector.status === 'connecting' ? 'text-yellow-600' : 'text-brand-khaki'
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  connector.status === 'connected' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' :
                  connector.status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-brand-gray'
                }`} />
                <span>{connector.status === 'connected' ? 'Bağlı' : connector.status === 'connecting' ? 'Qoşulur' : 'Bağlı deyil'}</span>
              </div>
            </div>

            {connector.status === 'connected' && connector.canvaUsername && (
              <div className="mb-3 text-sm text-brand-khaki">
                {connector.canvaUsername}
                {designs.length > 0 && (
                  <span className="ml-2 text-brand-gold">• {designs.length} dizayn</span>
                )}
              </div>
            )}

            <button
              onClick={handleCanvaToggle}
              disabled={connector.status === 'connecting'}
              className={`w-full py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                connector.status === 'connected'
                  ? 'bg-brand-ivory text-brand-khaki hover:bg-brand-gray border border-brand-gray'
                  : 'bg-gradient-to-r from-brand-gold to-[#C5A031] text-brand-navy shadow-lg shadow-brand-gold/20 hover:shadow-xl hover:shadow-brand-gold/30'
              } ${connector.status === 'connecting' ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {connector.status === 'connected' ? '🔌 Bağlantını Kəs' :
               connector.status === 'connecting' ? 'Qoşulur...' : '🔗 Canva ilə Bağlan'}
            </button>

            <CanvaPoweredBy className="mt-4 justify-center" />

            {connector.status === 'connected' && (
              <div className="mt-6 p-4 bg-brand-ivory rounded-xl">
                <p className="text-sm text-brand-khaki text-center">
                  Canva uğurla bağlandı! Canva dizaynlarınızı yaratmaq üçün AI Chat səhifəsinə keçin.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProDashboard;
