import React, { useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  suffix?: string;
  isMoney?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, suffix, isMoney = false, type = 'text', className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full text-left">
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-semibold text-ink mb-1.5 select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            type={computedType}
            className={`w-full h-10 px-3 bg-paper-raised border text-[15px] rounded-[2px] transition-colors duration-120 placeholder:text-ink-faint text-ink ${
              error
                ? 'border-oxblood focus:outline-none focus:border-oxblood focus:ring-2 focus:ring-oxblood-wash'
                : 'border-rule focus:outline-none focus:border-green focus:ring-2 focus:ring-green-wash'
            } ${isMoney ? 'font-mono text-right pr-14' : ''} ${isPassword ? 'pr-16' : ''} ${className}`}
            {...props}
          />

          {isMoney && suffix && (
            <span className="absolute right-3 text-xs font-mono font-medium text-ink-soft select-none pointer-events-none">
              {suffix}
            </span>
          )}

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-xs font-sans font-semibold text-ink-soft hover:text-ink transition-colors select-none"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>

        {error ? (
          <p className="mt-1 text-[12.5px] text-oxblood font-medium">
            <span className="font-semibold">Error:</span> {error}
          </p>
        ) : helperText ? (
          <p className="mt-1 text-[12.5px] text-ink-soft">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

