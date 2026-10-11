import { create } from 'zustand';
import { axiosInstance } from '@/lib/axiosInstance';
import { AuthUser } from '@/types';

/**
 * Backend rol adları 'admin' | 'user' qaytarır, route guard-lar isə
 * 'admin' | 'customer' gözləyir. Burada bir dəfə normallaşdırıb,
 * bütün komponentlər vahid dəyər alır.
 */
export function normalizeRole(role: string | undefined | null): AuthUser['role'] {
  return role === 'admin' ? 'admin' : 'customer';
}

/** API cavabını AuthUser-ə çevirir (rol normallaşdırılmış). */
export function toAuthUser(data: any): AuthUser {
  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    role: normalizeRole(data.role),
    plan: data.plan === 'pro' ? 'pro' : 'basic',
    isApproved: data.is_approved,
  };
}

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  redirectAfterLogin: null,

  setUser: (user) =>
    set({
      user: user ? { ...user, role: normalizeRole(user.role) } : null,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setRedirectAfterLogin: (path) => set({ redirectAfterLogin: path }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.get('/api/auth/me');
      set({
        user: toAuthUser(res.data),
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
