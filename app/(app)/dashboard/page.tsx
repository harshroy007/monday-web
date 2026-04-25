'use client';

import { useState, useEffect } from 'react';
import { getApiKey } from '@/lib/storage';
import { API_URL, ENDPOINTS } from '@/lib/constants';
import axios from 'axios';

function apiHeaders() {
  return { 'X-Jarvis-Key': getApiKey() ?? '', 'Content-Type': 'application/json' };
}

const GUARD_COLORS: Record<string, string> = {
  advisory: '#FB923C',
  caution:  '#FBBF24',
  warning:  '#F87171',
  critical: '#F87171',
};

const MOOD_COLOR: Record<string, string> = {
  positive: '#4ADE80', happy: '#4ADE80', excited: '#4ADE80', focused: '#60A5FA',
  neutral: '#EEEDF8', calm: '#60A5FA',
  negative: '#F87171', frustrated: '#FB923C', anxious: '#FB923C', stressed: '#F87171',
  mixed: '#FB923C',
};

function moodColor(mood: string) {
  const m = (mood || '').toLowerCase();
  for (const [k, v] of Object.entries(MOOD_COLOR)) if (m.includes(k)) return v;
  return '#EEEDF8';
}

function Sparkline({ days, data }: { days: string[]; data: any[] }) {
  if (!data || data.length === 0) return null;
  const labels = days.map(d => {
    const date = new Date(d);
    return ['Su','Mo','Tu','We','Th','Fr','Sa'][date.getDay()];
  });

  return (
    <div>
      <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-3">7-DAY TREND</p>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((d: any, i: number) => {
          const energyH  = d.energy  != null ? Math.round((d.energy  / 10) * 56) : 0;
          const confH    = d.conf    != null ? Math.round((d.conf    / 10) * 56) : 0;
          const isEmpty  = d.energy == null && d.conf == null;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-px items-end" style={{ height: 56 }}>
                <div
                  className="flex-1 rounded-sm transition-all"
                  style={{ height: isEmpty ? 2 : energyH, backgroundColor: isEmpty ? 'var(--color-border)' : '#4ADE8066' }}
                />
                <div
                  className="flex-1 rounded-sm transition-all"
                  style={{ height: isEmpty ? 2 : confH, backgroundColor: isEmpty ? 'var(--color-border)' : '#7C6FF766' }}
                />
              </div>
              <span className="text-[8px] text-[var(--color-dim)] font-mono">{labels[i]}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#4ADE8066' }} />
          <span className="text-[9px] text-[var(--color-muted)]">Energy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#7C6FF766' }} />
          <span className="text-[9px] text-[var(--color-muted)]">Confidence</span>
        </div>
      </div>
    </div>
  );
}

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

  const level = (dash?.guard?.level || guard?.level || 'advisory').toLowerCase();
  const guardColor = GUARD_COLORS[level] || '#FB923C';
  const stats   = dash?.stats || {};
  const signals = dash?.signals || [];
  const threats = guard?.threats || [];
  const latest  = dash?.latest;
  const sparkline = dash?.sparkline;

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Intel</h1>

      {/* Latest entry — most important */}
      {latest && (
        <div
          className="rounded-2xl p-4 border"
          style={{ backgroundColor: `${moodColor(latest.mood)}0D`, borderColor: `${moodColor(latest.mood)}33` }}
        >
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] tracking-widest uppercase" style={{ color: moodColor(latest.mood) }}>
              LAST SESSION
            </p>
            <span className="text-[10px] text-[var(--color-dim)] font-mono">{latest.at}</span>
          </div>
          {latest.insight && (
            <p className="text-sm text-[var(--color-text)] leading-relaxed mb-3 italic">"{latest.insight}"</p>
          )}
          <div className="flex gap-4">
            {latest.mood && (
              <div>
                <p className="text-[9px] text-[var(--color-muted)] uppercase mb-0.5">Mood</p>
                <p className="text-xs font-medium capitalize" style={{ color: moodColor(latest.mood) }}>{latest.mood}</p>
              </div>
            )}
            {latest.energy != null && (
              <div>
                <p className="text-[9px] text-[var(--color-muted)] uppercase mb-0.5">Energy</p>
                <p className="text-xs font-mono text-[var(--color-green)]">{latest.energy}/10</p>
              </div>
            )}
            {latest.confidence != null && (
              <div>
                <p className="text-[9px] text-[var(--color-muted)] uppercase mb-0.5">Confidence</p>
                <p className="text-xs font-mono text-[var(--color-purple)]">{latest.confidence}/10</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emotional weather */}
      {dash?.emotional_weather && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
          <p className="text-[10px] text-[var(--color-purple)] tracking-widest uppercase mb-2">MONDAY SEES</p>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">{dash.emotional_weather}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Today',  val: stats.entries_today ?? '—' },
          { label: 'Streak', val: stats.streak != null ? `${stats.streak}d` : '—' },
          { label: 'Avg E',  val: stats.avg_energy    != null ? stats.avg_energy.toFixed(1)    : '—' },
          { label: 'Avg C',  val: stats.avg_confidence != null ? stats.avg_confidence.toFixed(1) : '—' },
        ].map(s => (
          <div key={s.label} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-2.5 text-center">
            <p className="text-base font-bold text-[var(--color-purple)] font-mono leading-none mb-1">{String(s.val)}</p>
            <p className="text-[9px] text-[var(--color-muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      {sparkline?.data && sparkline.days && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
          <Sparkline days={sparkline.days} data={sparkline.data} />
        </div>
      )}

      {/* Guard status */}
      <div
        className="rounded-2xl p-4 border"
        style={{ backgroundColor: `${guardColor}0D`, borderColor: `${guardColor}33` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: guardColor }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: guardColor }}>
            Guard · {level}
          </span>
        </div>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed">
          {guard?.summary || dash?.guard?.summary || (threats.length === 0 ? 'No threats detected. You\'re good.' : '')}
        </p>
        {threats.length > 0 && (
          <div className="mt-3 space-y-2">
            {threats.map((t: any, i: number) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-[10px] font-mono text-[var(--color-muted)] mt-0.5 flex-shrink-0 uppercase">{t.level || 'INFO'}</span>
                <p className="text-xs text-[var(--color-text)]">{t.description || t.message}</p>
              </div>
            ))}
          </div>
        )}
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
                    backgroundColor: s.signal_type === 'stress' ? '#F8717122' : 'var(--color-purple-dim)',
                    color: s.signal_type === 'stress' ? '#F87171' : 'var(--color-purple)',
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
    </div>
  );
}
