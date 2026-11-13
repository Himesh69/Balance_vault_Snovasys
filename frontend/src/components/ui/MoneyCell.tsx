import React from 'react';

export interface MoneyCellProps {
  amount: number; // in cents or dollars based on isCents flag
  currency?: string;
  isCents?: boolean; // defaults to true per PRD integer cents standard
  direction?: 'DEBIT' | 'CREDIT' | 'BALANCE';
  showSign?: boolean;
  className?: string;
}

export const MoneyCell: React.FC<MoneyCellProps> = ({
  amount,
  currency = 'USD',
  isCents = true,
  direction = 'BALANCE',
  showSign = true,
  className = '',
}) => {
  const value = isCents ? amount / 100 : amount;
  const absValue = Math.abs(value);

  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue);

  let sign = '';
  let colorClass = 'text-ink';

  if (direction === 'DEBIT') {
    sign = showSign ? '−' : '';
    colorClass = 'text-oxblood';
  } else if (direction === 'CREDIT') {
    sign = showSign ? '+' : '';
    colorClass = 'text-green';
  } else {
    // Balance
    if (value < 0) {
      sign = '−';
      colorClass = 'text-oxblood';
    }
  }

  return (
    <span
      className={`font-mono text-right tabular-nums whitespace-nowrap font-medium ${colorClass} ${className}`}
    >
      <span className="select-none">{sign}</span>
      {currency === 'USD' ? '$' : `${currency} `}
      {formattedNum}
    </span>
  );
};

