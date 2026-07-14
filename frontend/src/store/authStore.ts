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
      const res = await axiosInstance.get('/api/auth/me');
      set({
        user: {
          id: res.data.id,
          email: res.data.email,
          firstName: res.data.first_name,
          lastName: res.data.last_name,
          role: res.data.role,
          plan: res.data.plan || 'basic',
        },
        isAuthenticated: true,
      });
    } catch {
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
