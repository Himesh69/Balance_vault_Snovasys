import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'destructive-outline';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-sans font-semibold text-sm h-10 px-4 rounded-[2px] transition-colors duration-120 select-none disabled:cursor-not-allowed';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-green text-paper-raised hover:bg-green-hover disabled:bg-paper-sunk disabled:text-ink-faint';
      break;
    case 'secondary':
      variantClasses =
        'bg-transparent border border-ink text-ink hover:bg-paper-sunk disabled:border-rule disabled:text-ink-faint';
      break;
    case 'tertiary':
      variantClasses =
        'bg-transparent text-green hover:underline px-2 h-auto rounded-none disabled:text-ink-faint';
      break;
    case 'destructive':
      variantClasses =
        'bg-oxblood text-paper-raised hover:opacity-90 disabled:bg-paper-sunk disabled:text-ink-faint';
      break;
    case 'destructive-outline':
      variantClasses =
        'bg-transparent border border-oxblood text-oxblood hover:bg-oxblood-wash disabled:border-rule disabled:text-ink-faint';
      break;
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <span>Working…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

