'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import * as api from '@/lib/api';

interface Entry {
  id: string;
  confidence: number;
  energy_level: number;
  mood: string;
  summary: string;
  source: string;
  created_at: string;
}

export default function FeedPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    try {
      const data = await api.fetchFeed();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load feed', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-[var(--color-muted)]">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-[var(--color-text)]">Feed</h1>

      {entries.length === 0 ? (
        <Card>
          <p className="text-[var(--color-muted)] text-center py-8">No entries yet. Start with a voice check-in on Home.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[var(--color-text)] font-semibold">{entry.mood}</p>
                  <p className="text-[var(--color-dim)] text-xs">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs text-[var(--color-muted)] bg-[var(--color-surface2)] px-2 py-1 rounded">
                  {entry.source}
                </span>
              </div>

              <p className="text-[var(--color-muted)] text-sm mb-3">{entry.summary}</p>

              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-[var(--color-dim)] text-xs">CONFIDENCE</p>
                  <p className="text-[var(--color-purple)] font-semibold">{entry.confidence?.toFixed(1) || '—'}</p>
                </div>
                <div>
                  <p className="text-[var(--color-dim)] text-xs">ENERGY</p>
                  <p className="text-[var(--color-blue)] font-semibold">{entry.energy_level?.toFixed(1) || '—'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
