import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { setNavigator } from '@/lib/navigation';

/**
 * Bütün route-ları əhatə edən layout route.
 * Router-u "qeydə alır" ki, axios interceptor səhifəni yeniləmədən
 * müştəri naviqasiyası edə bilsin.
 */
export function NavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigator((to, options) => navigate(to, options));
    return () => setNavigator(null);
  }, [navigate]);

  return <Outlet />;
}