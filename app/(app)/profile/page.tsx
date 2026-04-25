'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiKey, clearApiKey, clearUser, getUser } from '@/lib/storage';
import { API_URL, ENDPOINTS } from '@/lib/constants';
import axios from 'axios';

function apiHeaders() {
  return { 'X-Jarvis-Key': getApiKey() ?? '', 'Content-Type': 'application/json' };
}

type Tab = 'monday' | 'beliefs' | 'patterns' | 'privacy';

const TABS: { id: Tab; label: string }[] = [
  { id: 'monday',   label: 'Monday' },
  { id: 'beliefs',  label: 'Beliefs' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'privacy',  label: 'Privacy' },
];

function WikiMarkdown({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-xs font-semibold text-[var(--color-purple)] tracking-widest uppercase mt-4 first:mt-0">{line.slice(3)}</h3>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-semibold text-[var(--color-text)]">{line.slice(2, -2)}</p>;
        if (line.startsWith('- ')) return <p key={i} className="text-sm text-[var(--color-text)] pl-3 border-l-2 border-[var(--color-border-hi)]">{line.slice(2)}</p>;
        if (line.trim()) return <p key={i} className="text-sm text-[var(--color-text)] leading-relaxed">{line}</p>;
        return <div key={i} className="h-1" />;
      })}
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-10 h-10 rounded-full bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-3">
        <span className="text-lg">◎</span>
      </div>
      <p className="text-sm text-[var(--color-muted)]">{message}</p>
      {hint && <p className="text-xs text-[var(--color-dim)] mt-1.5 max-w-xs mx-auto leading-relaxed">{hint}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab]         = useState<Tab>('monday');
  const [wiki, setWiki]       = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [privacy, setPrivacy] = useState<any>(null);
  const [dash, setDash]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    async function load() {
      const [wikiRes, profileRes, privacyRes, dashRes] = await Promise.allSettled([
        axios.get(`${API_URL}${ENDPOINTS.WIKI}`,    { headers: apiHeaders() }),
        axios.get(`${API_URL}${ENDPOINTS.PROFILE}`, { headers: apiHeaders() }),
        axios.get(`${API_URL}${ENDPOINTS.PRIVACY_SUMMARY}`, { headers: apiHeaders() }),
        axios.get(`${API_URL}${ENDPOINTS.DASHBOARD}`, { headers: apiHeaders() }),
      ]);
      if (wikiRes.status === 'fulfilled')    setWiki(wikiRes.value.data);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      if (privacyRes.status === 'fulfilled') setPrivacy(privacyRes.value.data);
      if (dashRes.status === 'fulfilled')    setDash(dashRes.value.data);
      setLoading(false);
    }
    load();
  }, []);

  function logout() {
    clearApiKey();
    clearUser();
    router.replace('/register');
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--color-purple)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const beliefs  = profile?.beliefs  || [];
  const patterns = profile?.patterns || [];
  const hasUserWiki = wiki?.user && wiki.user.trim().length > 0;
  const hasBeliefsWiki = wiki?.beliefs && wiki.beliefs.trim().length > 0;
  const latest = dash?.latest;
  const totalEntries = dash?.stats?.total_entries ?? 0;

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Profile</h1>
          <p className="text-xs text-[var(--color-muted)]">{user?.email || 'Your account'}</p>
        </div>
        <button
          onClick={logout}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-red)] transition-colors px-3 py-1.5 rounded-lg border border-[var(--color-border)]"
        >
          Log out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--color-surface)] rounded-xl p-1 mb-5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: tab === t.id ? 'var(--color-purple-dim)' : 'transparent',
              color: tab === t.id ? 'var(--color-purple)' : 'var(--color-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'monday' && (
        <div className="space-y-4">
          {/* Show what Monday knows from latest entry */}
          {latest && (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
              <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-3">WHAT MONDAY OBSERVED</p>
              <p className="text-sm text-[var(--color-text)] italic leading-relaxed mb-3">"{latest.insight}"</p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {latest.mood && (
                  <div className="bg-[var(--color-surface2)] rounded-lg p-2 text-center">
                    <p className="text-[9px] text-[var(--color-muted)] mb-1">MOOD</p>
                    <p className="text-xs font-medium capitalize text-[var(--color-text)]">{latest.mood}</p>
                  </div>
                )}
                {latest.energy != null && (
                  <div className="bg-[var(--color-surface2)] rounded-lg p-2 text-center">
                    <p className="text-[9px] text-[var(--color-muted)] mb-1">ENERGY</p>
                    <p className="text-xs font-mono text-[var(--color-green)]">{latest.energy}/10</p>
                  </div>
                )}
                {latest.confidence != null && (
                  <div className="bg-[var(--color-surface2)] rounded-lg p-2 text-center">
                    <p className="text-[9px] text-[var(--color-muted)] mb-1">CONFIDENCE</p>
                    <p className="text-xs font-mono text-[var(--color-purple)]">{latest.confidence}/10</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasUserWiki ? (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
              <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-3">WHO MONDAY THINKS YOU ARE</p>
              <WikiMarkdown text={wiki.user} />
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
              <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-2">YOUR PROFILE</p>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                Monday builds a full profile after several sessions. You have <span className="text-[var(--color-purple)] font-mono">{totalEntries}</span> {totalEntries === 1 ? 'entry' : 'entries'} so far.
              </p>
              {dash?.emotional_weather && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <p className="text-[9px] text-[var(--color-muted)] uppercase mb-1">Monday sees</p>
                  <p className="text-sm text-[var(--color-text)] leading-relaxed">{dash.emotional_weather}</p>
                </div>
              )}
            </div>
          )}

          {hasBeliefsWiki && (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
              <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-3">WHAT MONDAY KNOWS</p>
              <WikiMarkdown text={wiki.beliefs} />
            </div>
          )}
        </div>
      )}

      {tab === 'beliefs' && (
        <div className="space-y-3">
          {beliefs.length === 0 ? (
            <EmptyState
              message="No beliefs extracted yet."
              hint={`Monday extracts beliefs after 5+ sessions. You have ${totalEntries} so far — keep recording.`}
            />
          ) : (
            beliefs.map((b: any, i: number) => (
              <div key={i} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm text-[var(--color-text)] leading-relaxed flex-1">{b.belief}</p>
                  <span
                    className="text-[10px] font-mono flex-shrink-0 px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: b.confidence_score > 0.7 ? '#4ADE8022' : 'var(--color-purple-dim)',
                      color: b.confidence_score > 0.7 ? '#4ADE80' : 'var(--color-purple)',
                    }}
                  >
                    {Math.round((b.confidence_score || 0) * 100)}%
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-muted)] mt-1">{b.category}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'patterns' && (
        <div className="space-y-3">
          {patterns.length === 0 ? (
            <EmptyState
              message="No patterns detected yet."
              hint="Patterns emerge after repeated behaviours across multiple sessions. Keep recording."
            />
          ) : (
            patterns.map((p: any, i: number) => (
              <div key={i} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p className="text-sm font-medium text-[var(--color-text)]">{p.name || p.pattern_text}</p>
                  <span className="text-[10px] text-[var(--color-muted)] font-mono flex-shrink-0">{p.occurrences}×</span>
                </div>
                {p.trigger_conditions && <p className="text-xs text-[var(--color-muted)]">Trigger: {p.trigger_conditions}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'privacy' && (
        <div className="space-y-4">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <p className="text-[10px] text-[var(--color-blue)] tracking-widest uppercase mb-3">ACCOUNT RECOVERY</p>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              To access your account on another device, use your email. Monday sends a login code — no password needed.
            </p>
            {user?.email && (
              <p className="text-xs text-[var(--color-purple)] mt-2 font-mono">{user.email}</p>
            )}
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <p className="text-[10px] text-[var(--color-green)] tracking-widest uppercase mb-2">YOUR DATA</p>
            <p className="text-xs text-[var(--color-muted)] mb-4">Stored only in your database. Never trained on.</p>
            {[
              { label: 'Entries recorded', val: totalEntries || '—' },
              { label: 'Beliefs',          val: privacy?.beliefs ?? beliefs.length ?? '—' },
              { label: 'Patterns',         val: privacy?.patterns ?? patterns.length ?? '—' },
              { label: 'People tracked',   val: privacy?.people ?? '—' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0">
                <span className="text-sm text-[var(--color-muted)]">{item.label}</span>
                <span className="text-sm font-mono text-[var(--color-purple)]">{item.val}</span>
              </div>
            ))}
          </div>

          <button
            onClick={logout}
            className="w-full py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-red)] hover:border-[var(--color-red)] transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
