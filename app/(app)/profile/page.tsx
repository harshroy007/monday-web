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
  if (!text) return <p className="text-sm text-[var(--color-muted)]">Nothing yet.</p>;
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-xs font-semibold text-[var(--color-purple)] tracking-widest uppercase mt-3 first:mt-0">{line.slice(3)}</h3>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-semibold text-[var(--color-text)]">{line.slice(2, -2)}</p>;
        if (line.startsWith('- ')) return <p key={i} className="text-sm text-[var(--color-text)] pl-3 border-l border-[var(--color-border)]">• {line.slice(2)}</p>;
        if (line.trim()) return <p key={i} className="text-sm text-[var(--color-text)] leading-relaxed">{line}</p>;
        return null;
      })}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab]         = useState<Tab>('monday');
  const [wiki, setWiki]       = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [privacy, setPrivacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    async function load() {
      const [wikiRes, profileRes, privacyRes] = await Promise.allSettled([
        axios.get(`${API_URL}${ENDPOINTS.WIKI}`,    { headers: apiHeaders() }),
        axios.get(`${API_URL}${ENDPOINTS.PROFILE}`, { headers: apiHeaders() }),
        axios.get(`${API_URL}${ENDPOINTS.PRIVACY_SUMMARY}`, { headers: apiHeaders() }),
      ]);
      if (wikiRes.status === 'fulfilled')    setWiki(wikiRes.value.data);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      if (privacyRes.status === 'fulfilled') setPrivacy(privacyRes.value.data);
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
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-3">WHO MONDAY THINKS YOU ARE</p>
            <WikiMarkdown text={wiki?.user || ''} />
          </div>
          {wiki?.beliefs && (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
              <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-3">WHAT MONDAY KNOWS</p>
              <WikiMarkdown text={wiki.beliefs} />
            </div>
          )}
        </div>
      )}

      {tab === 'beliefs' && (
        <div className="space-y-3">
          {beliefs.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-8">No beliefs extracted yet. Record some entries.</p>}
          {beliefs.map((b: any, i: number) => (
            <div key={i} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm text-[var(--color-text)] leading-relaxed flex-1">{b.belief}</p>
                <span
                  className="text-[10px] font-mono flex-shrink-0 px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: b.confidence_score > 0.7 ? 'var(--color-green)22' : 'var(--color-purple-dim)',
                    color: b.confidence_score > 0.7 ? 'var(--color-green)' : 'var(--color-purple)',
                  }}
                >
                  {Math.round((b.confidence_score || 0) * 100)}%
                </span>
              </div>
              <p className="text-[10px] text-[var(--color-muted)] mt-1">{b.category}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'patterns' && (
        <div className="space-y-3">
          {patterns.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-8">No patterns detected yet.</p>}
          {patterns.map((p: any, i: number) => (
            <div key={i} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3">
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="text-sm font-medium text-[var(--color-text)]">{p.name || p.pattern_text}</p>
                <span className="text-[10px] text-[var(--color-muted)] font-mono flex-shrink-0">{p.occurrences}×</span>
              </div>
              {p.trigger_conditions && <p className="text-xs text-[var(--color-muted)]">Trigger: {p.trigger_conditions}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'privacy' && (
        <div className="space-y-4">
          {/* Account info */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <p className="text-[10px] text-[var(--color-blue)] tracking-widest uppercase mb-3">ACCOUNT RECOVERY</p>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              To access your account on another device, use your email. Monday sends a login code — no password needed.
            </p>
          </div>

          {/* Data counts */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <p className="text-[10px] text-[var(--color-green)] tracking-widest uppercase mb-3">YOUR DATA</p>
            <p className="text-xs text-[var(--color-muted)] mb-4">Stored only in your database. Never trained on.</p>
            {[
              { label: 'Beliefs',        val: privacy?.beliefs ?? '—' },
              { label: 'Patterns',       val: privacy?.patterns ?? '—' },
              { label: 'People tracked', val: privacy?.people ?? '—' },
              { label: 'Decisions',      val: privacy?.decisions ?? '—' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0">
                <span className="text-sm text-[var(--color-muted)]">{item.label}</span>
                <span className="text-sm font-mono text-[var(--color-purple)]">{item.val}</span>
              </div>
            ))}
          </div>

          {/* Logout */}
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
