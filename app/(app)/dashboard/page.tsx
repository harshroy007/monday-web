'use client';

import { useState, useEffect } from 'react';
import { getApiKey } from '@/lib/storage';
import { API_URL, ENDPOINTS } from '@/lib/constants';
import axios from 'axios';

function apiHeaders() {
  return { 'X-Jarvis-Key': getApiKey() ?? '', 'Content-Type': 'application/json' };
}

const GUARD_COLORS: Record<string, string> = {
  ADVISORY: 'var(--color-orange)',
  CAUTION:  '#FBBF24',
  WARNING:  'var(--color-red)',
  CRITICAL: 'var(--color-red)',
};

export default function DashboardPage() {
  const [dash, setDash]   = useState<any>(null);
  const [guard, setGuard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [dashRes, guardRes] = await Promise.allSettled([
        axios.get(`${API_URL}${ENDPOINTS.DASHBOARD}`, { headers: apiHeaders() }),
        axios.get(`${API_URL}${ENDPOINTS.GUARD_FULL}`, { headers: apiHeaders() }),
      ]);
      if (dashRes.status === 'fulfilled')  setDash(dashRes.value.data);
      if (guardRes.status === 'fulfilled') setGuard(guardRes.value.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--color-purple)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const level = dash?.guard?.level || guard?.level || 'ADVISORY';
  const guardColor = GUARD_COLORS[level] || 'var(--color-orange)';
  const stats = dash?.stats || {};
  const signals = dash?.signals || [];
  const threats = guard?.threats || [];

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Intel</h1>

      {/* Guard status */}
      <div
        className="rounded-2xl p-4 border"
        style={{ backgroundColor: `${guardColor}11`, borderColor: `${guardColor}44` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: guardColor }} />
          <span className="text-xs font-semibold tracking-widest" style={{ color: guardColor }}>
            GUARD · {level}
          </span>
        </div>
        <p className="text-sm text-[var(--color-text)] leading-relaxed">
          {guard?.summary || dash?.guard?.summary || 'No threats detected.'}
        </p>
        {threats.length > 0 && (
          <div className="mt-3 space-y-2">
            {threats.map((t: any, i: number) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-[10px] font-mono text-[var(--color-muted)] mt-0.5 flex-shrink-0">{t.level || 'INFO'}</span>
                <p className="text-xs text-[var(--color-text)]">{t.description || t.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Entries today', val: stats.entries_today ?? '—' },
          { label: 'Streak',        val: stats.streak != null ? `${stats.streak}d` : '—' },
          { label: 'Total entries', val: stats.total_entries ?? '—' },
        ].map(s => (
          <div key={s.label} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-purple)] font-mono">{String(s.val)}</p>
            <p className="text-[10px] text-[var(--color-muted)] mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active signals */}
      {signals.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
          <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-3">ACTIVE SIGNALS</p>
          <div className="space-y-2">
            {signals.slice(0, 5).map((s: any, i: number) => (
              <div key={i} className="flex gap-3 items-center">
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: s.signal_type === 'stress' ? 'var(--color-red)22' : 'var(--color-purple-dim)',
                    color: s.signal_type === 'stress' ? 'var(--color-red)' : 'var(--color-purple)',
                  }}
                >
                  {(s.signal_type || 'signal').toUpperCase()}
                </span>
                <p className="text-xs text-[var(--color-text)] flex-1">{s.context || s.description || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotional weather */}
      {dash?.emotional_weather && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
          <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-2">MONDAY SEES</p>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">{dash.emotional_weather}</p>
        </div>
      )}
    </div>
  );
}
