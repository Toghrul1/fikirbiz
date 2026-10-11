/**
 * FikirBiz — API base URL.
 *
 * Production-da sorğular eyni mənşəli (same-origin) olmalıdır.
 *
 * Səhifə vercel.app, API isə onrender.com-də yerləşir — bu cross-site
 * sorğudur və brauzerlər üçüncü tərəf cookie-lərini bloklayır
 * (`SameSite=None` cookie saxlanmır). Nəticədə hər sorğu 401 qaytarır
 * və istifadəçi loqin səhifəsinə atılır.
 *
 * Həll: vercel.json-dakı `/api/*` → Render proxy-si. Sorğu vercel.app
 * üzərindən keçir, cookie first-party olur və hər brauzerdə işləyir.
 *
 * Yalnız lokal inkişafda birbaşa backend-ə gedirik.
 *
 * Bu modul `fetch` və `axios` arasında tək mənbə kimi istifadə olunur —
 * hardcoded URL təkrarlanmasın.
 */
export const API_BASE_URL: string = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL || 'http://localhost:8000'
  : '';

/** Tam URL qurur: apiUrl('/api/admin/stats') */
export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}