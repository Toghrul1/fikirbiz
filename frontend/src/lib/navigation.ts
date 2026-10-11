/**
 * Axios interceptor-dan React Router-a naviqasiya etmək üçü kiçik körpü.
 *
 * `useNavigate` yalnız komponentdə işləyir, interceptor isə komponentdən
 * kənardadır. Əvvəllər `window.location.href` istifadə olunurdu — bu isə
 * SPA-nı tam səhifə yeniləyirdi (state itirilir, "səhifə refresh olur"
 * simptomu yaranır və loop ola bilirdi).
 */

type NavigateFn = (to: string, options?: { replace?: boolean }) => void;

let navigator: NavigateFn | null = null;

/** RouterProvider daxilindəki komponent tərəfindən bir dəfə qeydə alınır. */
export function setNavigator(fn: NavigateFn | null) {
  navigator = fn;
}

/**
 * Router qeydə alınıbsa SPA naviqasiyası edir, yoxsa fallback.
 * Fallback yalnız router hələ qurulmamış halda baş verir.
 */
export function redirect(to: string) {
  if (navigator) {
    navigator(to, { replace: true });
  } else {
    window.location.href = to;
  }
}