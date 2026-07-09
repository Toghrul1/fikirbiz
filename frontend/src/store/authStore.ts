import { create } from 'zustand';
import { axiosInstance } from '@/lib/axiosInstance';
import { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  redirectAfterLogin: string | null;

  setUser: (user: AuthUser | null) => void;
  setRedirectAfterLogin: (path: string | null) => void;
  
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  redirectAfterLogin: null,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  
  setRedirectAfterLogin: (path) => set({ redirectAfterLogin: path }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      // Profil məlumatlarını gətiririk ki, həm user data-nı alaq, həm də cookie-lərin 
      // etibarlı olub-olmadığını yoxlayaq. 
      // Qeyd: admin login etdikdə customer/profile xəta verəcək (403), 
      // reallıqda rol aydınlaşdırmaq üçün ümumi bir `/api/auth/me` endpoint-i olardı,
      // lakin sənədə görə /customer/profile və ya /admin/users yoxlanılır.
      // Hələlik sadə profil endpointi yoxlanışı edək:
      try {
        // Customer profile cəhdi
        const res = await axiosInstance.get('/api/customer/profile');
        set({ 
          user: { 
            id: res.data.id, 
            email: res.data.email, 
            firstName: res.data.first_name, 
            lastName: res.data.last_name, 
            role: 'customer' 
          }, 
          isAuthenticated: true 
        });
      } catch (err: any) {
        if (err.response?.status === 403) {
          // Əgər customer deyilsə və admin-dirsə
          // Mock admin istifadəçisi (reallıqda /api/admin/me olmalıdır)
          set({ 
            user: { id: 'admin', email: 'admin@fikirbiz.com', firstName: 'Admin', lastName: 'User', role: 'admin' }, 
            isAuthenticated: true 
          });
        } else {
          // Başqa xəta isə (401) logout olmuş sayılır
          set({ user: null, isAuthenticated: false });
        }
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (error) {
      // Səhvləri ignore et (zatən çıxış edirik)
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  refreshToken: async () => {
    try {
      await axiosInstance.post('/api/auth/refresh');
      return true;
    } catch (error) {
      set({ user: null, isAuthenticated: false });
      return false;
    }
  }
}));
