import axios from 'axios';

// Backend URL-i konfiqurasiyadan və ya mühit dəyişənlərindən götürün
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // HTTPOnly cookielərin göndərilməsi üçün vacibdir
});

// Interceptor-da istifadə etmək üçün store-u lazy import edirik 
// (circular dependency probleminin qarşısını almaq üçün)
let authStore: any;
const getAuthStore = async () => {
  if (!authStore) {
    const { useAuthStore } = await import('@/store/authStore');
    authStore = useAuthStore.getState();
  }
  return authStore;
};

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Əgər 401 gəlibsə və səhv INVALID_CREDENTIALS (login səhvi) deyilsə, 
    // deməli tokenin vaxtı bitib, yeniləməyə çalışırıq.
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
        } else {
          // Token yenilənmədi, logout/login səhifəsinə göndəririk
          store.setRedirectAfterLogin(window.location.pathname);
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (e) {
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);
