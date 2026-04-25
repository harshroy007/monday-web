'use client';

import { useState, useEffect } from 'react';
import { getApiKey } from '@/lib/storage';
import { API_URL, ENDPOINTS } from '@/lib/constants';
import axios from 'axios';

function apiHeaders() {
  return { 'X-Jarvis-Key': getApiKey() ?? '', 'Content-Type': 'application/json' };
}

function formatDate(ts: string) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return ts; }
}

const MOOD_COLOR: Record<string, string> = {
  positive: 'var(--color-green)',
  negative: 'var(--color-red)',
  neutral:  'var(--color-muted)',
  mixed:    'var(--color-orange)',
};

export default function FeedPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`${API_URL}${ENDPOINTS.FEED}`, { headers: apiHeaders() });
        setEntries(res.data.entries || res.data || []);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight mb-5">Feed</h1>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--color-purple)] border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--color-muted)]">No entries yet.</p>
          <p className="text-xs text-[var(--color-dim)] mt-2">Record your first voice entry in the app to see it here.</p>
        </div>
      )}

      <div className="space-y-3">
        {entries.map((e: any) => (
          <div key={e.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: MOOD_COLOR[e.mood] || 'var(--color-muted)' }}
                />
                <p className="text-[10px] text-[var(--color-muted)] font-mono">{formatDate(e.created_at)}</p>
              </div>
              <span className="text-[10px] text-[var(--color-dim)] font-mono capitalize">{e.day_period || ''}</span>
            </div>
            {e.key_insight && (
              <p className="text-sm font-medium text-[var(--color-text)] mb-1">{e.key_insight}</p>
            )}
            {e.topics && e.topics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(typeof e.topics === 'string' ? e.topics.split(',') : e.topics).slice(0, 4).map((t: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-purple-dim)] text-[var(--color-purple)]">
                    {t.trim()}
                  </span>
                ))}
              </div>
            )}
            {e.word_count && (
              <p className="text-[10px] text-[var(--color-dim)] mt-2">{e.word_count} words</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
