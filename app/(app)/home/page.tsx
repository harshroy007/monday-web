'use client';

import { useState, useEffect, useRef } from 'react';
import { getApiKey, getUser } from '@/lib/storage';
import { API_URL, ENDPOINTS } from '@/lib/constants';
import axios from 'axios';

type OrbState = 'idle' | 'recording' | 'processing' | 'done';

function apiHeaders() {
  return { 'X-Jarvis-Key': getApiKey() ?? '', 'Content-Type': 'application/json' };
}

export default function HomePage() {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [reply, setReply]       = useState('');
  const [brief, setBrief]       = useState('');
  const [actions, setActions]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const user = getUser();

  useEffect(() => {
    async function load() {
      try {
        const [briefRes, actionsRes] = await Promise.allSettled([
          axios.get(`${API_URL}${ENDPOINTS.BRIEF}`, { headers: apiHeaders() }),
          axios.get(`${API_URL}${ENDPOINTS.ACTIONS}`, { headers: apiHeaders() }),
        ]);
        if (briefRes.status === 'fulfilled') setBrief(briefRes.value.data.brief || '');
        if (actionsRes.status === 'fulfilled') {
          const d = actionsRes.value.data;
          setActions([...(d.commitments || []).slice(0, 3), ...(d.upcoming_events || []).slice(0, 2)]);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  async function handleOrbClick() {
    if (orbState !== 'idle') return;
    setOrbState('recording');
    setReply('');

    // Web doesn't have native mic access by default — use chat fallback
    // For real voice: use MediaRecorder API (Phase 2)
    // For now: show a prompt input
    setOrbState('idle');
  }

  const orbColor = {
    idle: 'var(--color-purple)',
    recording: 'var(--color-red)',
    processing: 'var(--color-purple)',
    done: 'var(--color-green)',
  }[orbState];

  return (
    <div className="min-h-full flex flex-col px-4 pt-8">
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-xs text-[var(--color-muted)] tracking-widest uppercase mb-1">Good day</p>
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
          {user?.name && user.name !== 'Monday User' ? user.name : 'Welcome'}
        </h1>
      </div>

      {/* Brief */}
      {!loading && brief && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-4">
          <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-2">MONDAY'S BRIEF</p>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">{brief}</p>
        </div>
      )}

      {/* Orb */}
      <div className="flex flex-col items-center my-8">
        <button
          onClick={handleOrbClick}
          className="w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 relative"
          style={{
            backgroundColor: `${orbColor}22`,
            border: `2px solid ${orbColor}44`,
            boxShadow: `0 0 40px ${orbColor}33`,
          }}
        >
          <div
            className="w-20 h-20 rounded-full"
            style={{ backgroundColor: `${orbColor}33`, border: `2px solid ${orbColor}` }}
          />
        </button>
        <p className="text-xs text-[var(--color-muted)] mt-3">
          {orbState === 'idle' ? 'Tap to talk (coming soon)' : orbState}
        </p>
      </div>

      {/* Quick chat link */}
      <a
        href="/chat"
        className="w-full py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center text-sm text-[var(--color-purple)] font-medium mb-4 block hover:border-[var(--color-border-hi)] transition-colors"
      >
        Chat with Monday →
      </a>

      {/* Actions / commitments */}
      {actions.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-4">
          <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-3">ON YOUR PLATE</p>
          {actions.map((a: any, i: number) => (
            <div key={i} className="flex gap-3 items-start mb-3 last:mb-0">
              <span className="text-[var(--color-purple)] text-xs mt-0.5">•</span>
              <p className="text-sm text-[var(--color-text)] leading-relaxed flex-1">
                {a.commitment_text || a.description || '—'}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--color-purple)] border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
