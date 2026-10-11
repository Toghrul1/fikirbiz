import axios from 'axios';
import { redirect } from '@/lib/navigation';
import { API_BASE_URL } from '@/lib/apiBase';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // HTTPOnly cookielərin göndərilməsi üçün vacibdir
});

// Interceptor-da istifadə etmək üçün store-u lazy import edirik 
// (circular dependency probleminin qarşısını almaq üçün)
//
// Diqqət: store-u bir dəfə `getState()` ilə keşləyə bilmərik — zustand
// hər `set`-də yeni state obyekti yaradır, keş köhnələndiyi üçün
// içindəki funksiyalar eski state-ə bağlı qalardı. Hər dəfə təzə alırıq.
const getAuthStore = async () => {
  const { useAuthStore } = await import('@/store/authStore');
  return useAuthStore.getState();
};

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Əgər 401 gəlibsə və səhv INVALID_CREDENTIALS (login səhvi) deyilsə, 
    // deməli tokenin vaxtı bitib, yeniləməyə çalışırıq.
    const isAdminRequest = originalRequest.url?.startsWith('/api/admin');
    const target = isAdminRequest ? '/admin/login' : '/login';

    if (
      error.response?.status === 401 && 
      error.response?.data?.detail?.code !== 'INVALID_CREDENTIALS' &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/refresh')
    ) {
      originalRequest._retry = true;
      
      try {
        const store = await getAuthStore();
        const refreshed = await store.refreshToken();
        
        if (refreshed) {
          // Token yeniləndi, orijinal sorğunu təkrar edirik
          return axiosInstance(originalRequest);
        }

        // Sessiya bərpa olunmadı → giriş səhifəsinə yönləndir.
        store.setRedirectAfterLogin(window.location.pathname);

        // Artıq giriş səhifəsindəsəyiksə, təkrar yönləndirmə yalnız
        // "refresh → login → 401 → refresh" dövranı yaradır.
        if (window.location.pathname !== target) {
          redirect(target);
        }
        return Promise.reject(error);
      } catch (e) {
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);
