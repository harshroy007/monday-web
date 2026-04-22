'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function Button({ children, onClick, disabled = false, isLoading = false, className = '' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`px-6 py-3 bg-[var(--color-purple)] text-[var(--color-bg)] rounded-lg font-semibold transition-all hover:bg-[var(--color-purple)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
