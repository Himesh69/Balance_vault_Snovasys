import React from 'react';

export interface PanelProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hasDocumentHeader?: boolean; // 3px strong top border like a paper document
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  hasDocumentHeader = false,
}) => {
  return (
    <div
      className={`bg-paper-raised border border-rule rounded-[2px] p-6 text-left ${
        hasDocumentHeader ? 'border-t-[3px] border-t-rule-strong' : ''
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="pb-4 mb-5 border-b border-rule flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="font-serif text-[22px] leading-7 font-medium text-ink">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[13px] text-ink-soft mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

