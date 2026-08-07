import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/lib/useTranslation';

type Status = 'idle' | 'loading' | 'success' | 'error';

const PROMPT_MAX_LENGTH = 2000;

export function ImageGenerator() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const planLabel = user?.plan === 'pro' ? 'FikirBiz Pro' : 'FikirBiz Basic';

  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || status === 'loading') return;

    setStatus('loading');
    setError(null);
    setImageUrl(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/images/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: trimmed }),
      });

      if (!response.ok) {
        let message = t('imageError');
        try {
          const data = await response.json();
          if (data?.detail?.code === 'QUOTA_EXCEEDED') {
            message = t('imageQuotaExceeded');
          } else if (data?.detail?.message) {
            message = data.detail.message;
          }
        } catch {
          // non-JSON error body
        }
        setError(message);
        setStatus('error');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      setImageUrl(url);
      setStatus('success');
    } catch {
      setError(t('networkError'));
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-brand-ivory">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">
            🎨 {t('imageTitle')} — {planLabel}
          </h1>
          <p className="text-brand-khaki">{t('imageDesc')}</p>
        </div>

        <div className="relative z-10 bg-white rounded-2xl shadow-lg p-6 mb-6 border border-brand-gray">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-brand-khaki font-semibold">
                📝 {t('imagePrompt')}
              </label>
              <span className="text-xs text-brand-gray">
                {prompt.length}/{PROMPT_MAX_LENGTH}
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, PROMPT_MAX_LENGTH))}
              placeholder={t('imagePromptPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 bg-brand-ivory border border-brand-gray rounded-xl text-brand-navy placeholder-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent resize-none"
            />
            <p className="text-xs text-brand-gray mt-1">{t('imagePromptHint')}</p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || status === 'loading'}
            className="w-full py-4 bg-brand-gold text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('generatingImage')}
              </span>
            ) : (
              `✨ ${t('generateImage')}`
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {status === 'success' && imageUrl && (
          <div className="relative z-10 bg-white rounded-2xl shadow-lg border border-brand-gray overflow-hidden">
            <div className="p-6">
              <img
                src={imageUrl}
                alt="AI generated"
                className="w-full rounded-xl shadow-md bg-brand-gray/20"
              />
              <div className="flex gap-3 mt-4">
                <a
                  href={imageUrl}
                  download="fikirbiz-image.jpg"
                  className="flex-1 py-3 bg-brand-navy text-brand-gold font-semibold rounded-xl text-center hover:shadow-lg transition-all"
                >
                  ⬇️ {t('imageDownload')}
                </a>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setImageUrl(null);
                  }}
                  className="flex-1 py-3 bg-brand-ivory text-brand-khaki font-semibold rounded-xl border border-brand-gray hover:bg-brand-gray/30 transition-all"
                >
                  ✨ {t('imageGenerateAnother')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageGenerator;
