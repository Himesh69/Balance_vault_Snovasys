import React from 'react';

export type BannerType = 'error' | 'success' | 'warning' | 'info';

export interface BannerProps {
  type?: BannerType;
  title?: string;
  message: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  let colorClasses = '';
  let borderClass = '';

  switch (type) {
    case 'error':
      colorClasses = 'bg-oxblood-wash text-oxblood';
      borderClass = 'border-oxblood/40';
      break;
    case 'success':
      colorClasses = 'bg-green-wash text-green';
      borderClass = 'border-green/40';
      break;
    case 'warning':
      colorClasses = 'bg-brass-wash text-brass';
      borderClass = 'border-brass/40';
      break;
    case 'info':
    default:
      colorClasses = 'bg-paper-sunk text-ink';
      borderClass = 'border-rule';
      break;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`w-full p-3.5 border rounded-[2px] flex items-start justify-between gap-3 text-sm font-sans ${colorClasses} ${borderClass} ${className}`}
    >
      <div className="flex-1 text-left">
        {title && <span className="font-semibold block mb-0.5">{title}</span>}
        <div className="text-[13.5px] leading-relaxed">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold uppercase tracking-wider underline hover:opacity-75 transition-opacity select-none flex-shrink-0"
        >
          Close
        </button>
      )}
    </div>
  );
};

