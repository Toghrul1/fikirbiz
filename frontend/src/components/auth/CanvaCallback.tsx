import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

export const CanvaCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkCanvaStatus = useAppStore((s) => s.checkCanvaStatus);

  useEffect(() => {
    const success = searchParams.get('canva_success');
    const error = searchParams.get('canva_error');

    if (success === 'true') {
      // Canva bağlantısı uğurla quruldu, statusu yenilə
      checkCanvaStatus().then(() => {
        navigate('/customer/dashboard', { replace: true });
      });
    } else if (error) {
      // Xəta baş verdi, dashboard-a qayıt
      console.error('Canva OAuth error:', error);
      navigate('/customer/dashboard', { replace: true });
    } else {
      // Heç bir parametr yoxdursa, dashboard-a qayıt
      navigate('/customer/dashboard', { replace: true });
    }
  }, [searchParams, navigate, checkCanvaStatus]);

  return (
    <div className="min-h-screen bg-brand-ivory flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4"></div>
        <p className="text-brand-navy">Canva bağlantısı yoxlanılır...</p>
      </div>
    </div>
  );
};
