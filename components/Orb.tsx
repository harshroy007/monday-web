'use client';

import { useState } from 'react';

type OrbState = 'idle' | 'recording' | 'processing' | 'reply';

interface OrbProps {
  state: OrbState;
  onClick: () => void;
  disabled?: boolean;
}

export function Orb({ state, onClick, disabled = false }: OrbProps) {
  const stateConfig: Record<OrbState, { bgColor: string; outerColor: string; label: string }> = {
    idle: { bgColor: 'bg-[var(--color-purple)]', outerColor: 'from-[var(--color-purple)]', label: 'Tap to talk' },
    recording: { bgColor: 'bg-[var(--color-red)]', outerColor: 'from-[var(--color-red)]', label: 'Listening...' },
    processing: { bgColor: 'bg-[var(--color-purple)]', outerColor: 'from-[var(--color-purple)]', label: 'Processing...' },
    reply: { bgColor: 'bg-[var(--color-green)]', outerColor: 'from-[var(--color-green)]', label: 'Reply ready' },
  };

  const config = stateConfig[state];
  const isAnimating = state === 'recording' || state === 'processing';

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className="relative w-32 h-32 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Outer ring (animated when recording/processing) */}
        <div
          className={`absolute inset-0 rounded-full ${config.outerColor} to-transparent opacity-20 ${
            isAnimating ? 'animate-pulse' : ''
          }`}
          style={{
            background: isAnimating
              ? `conic-gradient(${config.outerColor}, transparent)`
              : `radial-gradient(circle, ${config.outerColor}, transparent)`,
          }}
        />

        {/* Middle ring */}
        <div
          className={`absolute inset-2 rounded-full opacity-30 border border-current`}
          style={{
            color: config.bgColor.replace('bg-', ''),
          }}
        />

        {/* Inner circle */}
        <div
          className={`absolute inset-6 rounded-full ${config.bgColor} flex items-center justify-center shadow-lg transition-all ${
            isAnimating ? 'animate-pulse' : ''
          }`}
        >
          {state === 'idle' && <span className="text-2xl">🎤</span>}
          {state === 'recording' && <span className="text-2xl animate-bounce">🎙️</span>}
          {state === 'processing' && <span className="text-2xl animate-spin">⚙️</span>}
          {state === 'reply' && <span className="text-2xl">✓</span>}
        </div>
      </button>

      {/* Label */}
      <div className="text-center">
        <p className="text-[var(--color-text)] font-semibold">{config.label}</p>
      </div>
    </div>
  );
}
