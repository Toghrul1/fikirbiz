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
      checkCanvaStatus().then(() => {
        navigate('/customer/chat', { replace: true });
      });
    } else if (error) {
      console.error('Canva OAuth error:', error);
      navigate('/customer/chat', { replace: true });
    } else {
      navigate('/customer/chat', { replace: true });
    }
  }, [searchParams, navigate, checkCanvaStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1EB] via-[#EFE7DC] to-[#E8DDD0] flex items-center justify-center">
      <div className="text-center" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-brand-gold/20 border-t-brand-gold mx-auto mb-6" />
        <p className="text-brand-navy font-medium">Canva bağlantısı yoxlanılır...</p>
      </div>
    </div>
  );
};
