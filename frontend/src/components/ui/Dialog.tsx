import React, { useEffect } from 'react';
import { Button } from './Button.js';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmVariant?: 'primary' | 'destructive';
  loading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel = 'Confirm',
  onConfirm,
  confirmVariant = 'primary',
  loading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(28, 33, 30, 0.45)' }}
    >
      <div
        className="w-full max-w-[480px] bg-paper-raised border border-ink rounded-[2px] p-6 text-left"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="font-serif text-xl font-medium text-ink pb-3 mb-4 border-b border-rule">
          {title}
        </h3>

        <div className="text-sm text-ink mb-6 leading-relaxed">{children}</div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-rule">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {onConfirm && (
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

