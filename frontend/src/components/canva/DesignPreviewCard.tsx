import React, { useState } from 'react';
import { CanvaDesignLink } from '@/types';
import { useAppStore } from '@/store/appStore';

interface DesignPreviewCardProps {
  design: CanvaDesignLink;
  compact?: boolean;
}

export const DesignPreviewCard: React.FC<DesignPreviewCardProps> = ({ design, compact = false }) => {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { exportDesign, addToast } = useAppStore();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(design.editUrl);
      setCopied(true);
      addToast({ type: 'success', title: 'Link kopyalandı' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ type: 'error', title: 'Link kopyalana bilmədi' });
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const result = await exportDesign(design.designId, 'png');
    setExporting(false);
    if (result?.urls && result.urls.length > 0) {
      addToast({ type: 'success', title: 'İxrac uğurlu oldu' });
      window.open(result.urls[0], '_blank');
    }
  };

  if (compact) {
    return (
      <a
        href={design.editUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-xl bg-brand-gold/[0.04] border border-brand-gold/15 hover:bg-brand-gold/[0.08] hover:border-brand-gold/30 hover:shadow-sm transition-all duration-200 group"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-gold to-[#C5A031] text-brand-navy font-bold text-xs shadow-sm">
          {design.contentType === 'DESIGN' ? 'DSGN' : design.contentType.substring(0, 4)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-brand-navy truncate">
            {design.title || 'Canva Dizaynı'}
          </p>
          <p className="text-xs text-brand-navy/40 truncate group-hover:text-brand-gold transition-colors">
            Klikləyərək redaktə et
          </p>
        </div>
        <div className="shrink-0 text-brand-gold/50 group-hover:text-brand-gold transition-all duration-200 group-hover:translate-x-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </div>
      </a>
    );
  }

  return (
    <div className="rounded-2xl border border-black/[0.04] bg-white shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-brand-gold/10 to-brand-navy/5 flex items-center justify-center">
        {design.thumbnailUrl ? (
          <img
            src={design.thumbnailUrl}
            alt={design.title || 'Canva Design'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-brand-navy/20">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span className="text-sm">Dizayn önizləməsi</span>
          </div>
        )}
        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-brand-navy/70 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wide">
          {design.contentType}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-brand-navy truncate">
          {design.title || 'Canva Dizaynı'}
        </h3>
        {design.createdAt && (
          <p className="mt-1 text-xs text-brand-navy/40">
            Yaradıldı: {new Date(design.createdAt * 1000).toLocaleDateString('az-AZ')}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          <a
            href={design.editUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-[#C5A031] text-brand-navy text-sm font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Redaktə et
          </a>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-black/[0.06] text-brand-navy text-sm font-medium hover:bg-brand-ivory hover:border-brand-gold/30 transition-all duration-200 disabled:opacity-40"
          >
            {exporting ? (
              <div className="w-4 h-4 rounded-full border-2 border-brand-navy/30 border-t-brand-navy animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            İxrac et
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-black/[0.06] text-brand-navy text-sm font-medium hover:bg-brand-ivory hover:border-brand-gold/30 transition-all duration-200"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            )}
            {copied ? 'Kopyalandı' : 'Linki kopyala'}
          </button>
        </div>
      </div>
    </div>
  );
};
