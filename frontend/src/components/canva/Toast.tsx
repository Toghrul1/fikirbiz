import React, { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { Toast as ToastType } from '@/types';

const toastStyles: Record<ToastType['type'], { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-gradient-to-r from-green-50 to-emerald-50/50',
    border: 'border-green-200/50',
    icon: (
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  },
  error: {
    bg: 'bg-gradient-to-r from-red-50 to-rose-50/50',
    border: 'border-red-200/50',
    icon: (
      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
    ),
  },
  warning: {
    bg: 'bg-gradient-to-r from-yellow-50 to-amber-50/50',
    border: 'border-yellow-200/50',
    icon: (
      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
    ),
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-50 to-indigo-50/50',
    border: 'border-blue-200/50',
    icon: (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      </div>
    ),
  },
};

interface ToastItemProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const style = toastStyles[toast.type];

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => onRemove(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-sm ${style.bg} ${style.border} animate-in slide-in-from-right fade-in duration-300`}
    >
      {style.icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-navy">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-sm text-brand-navy/60">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded-lg text-brand-navy/20 hover:text-brand-navy/60 hover:bg-black/5 transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};
