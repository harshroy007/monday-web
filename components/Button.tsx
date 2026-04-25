'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function Button({
  children,
  onClick,
  disabled = false,
  isLoading = false,
  className = '',
  variant = 'primary',
}: ButtonProps) {
  const baseClass = 'px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClass = {
    primary:
      'bg-[var(--color-purple)] text-white hover:bg-[var(--color-purple)] hover:opacity-90',
    secondary:
      'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-purple)] hover:opacity-80',
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClass} ${variantClass} ${className}`}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
