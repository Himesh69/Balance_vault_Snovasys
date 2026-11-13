import React from 'react';

export type BadgeVariant = 'green' | 'brass' | 'oxblood' | 'slate-blue' | 'neutral';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  isPending?: boolean; // If true, outline square glyph □; else solid ■
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  isPending,
  className = '',
}) => {
  const textStr = String(children).toUpperCase();

  // Auto-detect variant if not explicitly provided
  let computedVariant: BadgeVariant = variant || 'neutral';
  let computedPending = isPending;

  if (!variant) {
    if (['VERIFIED', 'APPROVED', 'ACTIVE', 'SUCCESS', 'CREDIT'].includes(textStr)) {
      computedVariant = 'green';
      if (computedPending === undefined) computedPending = false;
    } else if (['PENDING', 'SUBMITTED', 'DRAFT', 'AWAITING'].includes(textStr)) {
      computedVariant = 'brass';
      if (computedPending === undefined) computedPending = true;
    } else if (['REJECTED', 'SUSPENDED', 'ERROR', 'DEBIT', 'CLOSED'].includes(textStr)) {
      computedVariant = 'oxblood';
      if (computedPending === undefined) computedPending = false;
    } else if (['ADMIN', 'ACCOUNT_HOLDER', 'HOLDER', 'SYSTEM'].includes(textStr)) {
      computedVariant = 'slate-blue';
      if (computedPending === undefined) computedPending = false;
    }
  }

  let colorClasses = '';
  switch (computedVariant) {
    case 'green':
      colorClasses = 'border-green/40 bg-green-wash text-green';
      break;
    case 'brass':
      colorClasses = 'border-brass/40 bg-brass-wash text-brass';
      break;
    case 'oxblood':
      colorClasses = 'border-oxblood/40 bg-oxblood-wash text-oxblood';
      break;
    case 'slate-blue':
      colorClasses = 'border-slate-blue/40 bg-[#E5ECF4] text-slate-blue';
      break;
    case 'neutral':
    default:
      colorClasses = 'border-rule bg-paper-sunk text-ink-soft';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-medium tracking-wide uppercase border rounded-[2px] select-none ${colorClasses} ${className}`}
    >
      <span className="text-[8px] leading-none select-none">
        {computedPending ? '□' : '■'}
      </span>
      <span>{children}</span>
    </span>
  );
};

