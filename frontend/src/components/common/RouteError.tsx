import { useRouteError, Link, isRouteErrorResponse } from 'react-router-dom';
import { useTranslation } from '@/lib/useTranslation';

/**
 * Router xətaları üçün errorElement: tapılmamış səhifələr də daxil olmaqla.
 */
export function RouteError({ notFound = false }: { notFound?: boolean }) {
  const error = useRouteError();
  const { t } = useTranslation();

  const isNotFound = notFound || (isRouteErrorResponse(error) && error.status === 404);
  const status = isRouteErrorResponse(error) ? error.status : 500;

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-ivory p-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-gray/30 bg-white p-8 text-center shadow-xl">
        <p className="mb-2 font-mono text-5xl font-light text-brand-gold">{isNotFound ? '404' : status}</p>
        <h1 className="mb-2 text-2xl font-bold text-brand-navy">
          {isNotFound ? t('pageNotFoundTitle') : t('pageErrorTitle')}
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-brand-khaki">
          {isNotFound ? t('pageNotFoundBody') : t('pageErrorBody')}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="flex-1 rounded-xl bg-brand-navy px-4 py-3 text-sm font-medium text-brand-gold transition-colors hover:bg-[#162a40]"
          >
            {t('goHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}