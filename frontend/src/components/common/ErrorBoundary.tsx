import React from 'react';
import { useTranslation } from '@/lib/useTranslation';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Render xətası baş verdiyə istifadəçiyə "Hey developer" mesajı göstərmək əvəzinə
 * insan oxuna bilən səhifə göstərir və "Yenidən cəhd et" təklif edir.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Production-da konsola yazmaq əvəzinə xətanı servera göndərmək
    // daha yaxşı olardı; ən azından konsolda itirməyək.
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }
    return <ErrorScreen error={this.state.error} onRetry={() => this.setState({ error: null })} />;
  }
}

/** Tərcümə hook-u klass komponentində işləmədiyi üçün ayrıca funksional komponent. */
function ErrorScreen({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-ivory p-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-gray/30 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-brand-navy">{t('pageErrorTitle')}</h1>
        <p className="mb-6 text-sm leading-relaxed text-brand-khaki">{t('pageErrorBody')}</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onRetry}
            className="flex-1 rounded-xl bg-brand-navy px-4 py-3 text-sm font-medium text-brand-gold transition-colors hover:bg-[#162a40]"
          >
            {t('tryAgain')}
          </button>
          <a
            href="/"
            className="flex-1 rounded-xl border border-brand-gray px-4 py-3 text-sm font-medium text-brand-navy transition-colors hover:border-brand-gold hover:text-brand-gold"
          >
            {t('goHome')}
          </a>
        </div>

        {import.meta.env.DEV && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-brand-khaki">{t('errorDetails')}</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-brand-ivory p-3 text-[11px] leading-relaxed text-brand-navy">
              {error.message}
              {'\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}