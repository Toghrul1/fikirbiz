import React from 'react';

interface CanvaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const CanvaLogo: React.FC<CanvaLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizes = {
    sm: { icon: 24, text: 'text-xs' },
    md: { icon: 32, text: 'text-sm' },
    lg: { icon: 48, text: 'text-lg' },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Canva Icon Logo - Official */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Canva"
      >
        <path
          d="M256 512C397.4 512 512 397.4 512 256C512 114.6 397.4 0 256 0C114.6 0 0 114.6 0 256C0 397.4 114.6 512 256 512Z"
          fill="#00C4CC"
        />
        <path
          d="M349.4 149.4C385.6 149.4 414.8 178.6 414.8 214.8V256H293.4V149.4H349.4Z"
          fill="white"
        />
        <path
          d="M256 256V362.6C256 398.8 226.8 428 190.6 428C172.4 428 155.8 420.4 143.8 408.2L190.6 361.4C195.4 356.6 202.2 353.8 209.4 353.8C217.8 353.8 225.2 361.2 225.2 369.6V256H256Z"
          fill="white"
        />
      </svg>
      {showText && (
        <span className={`font-semibold text-brand-navy ${text}`}>
          Canva
        </span>
      )}
    </div>
  );
};

export const CanvaPoweredBy: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1.5 text-xs text-brand-gray/60 ${className}`}>
      <CanvaLogo size="sm" showText={false} />
      <span>Powered by Canva</span>
    </div>
  );
};
