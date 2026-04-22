'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import * as api from '@/lib/api';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const dashData = await api.fetchDashboard();
      setData(dashData);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-[var(--color-muted)]">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-[var(--color-text)]">Dashboard</h1>

      {/* Guard Banner */}
      {data?.guard && (
        <Card className="border-2" style={{
          borderColor: data.guard.level === 'CRITICAL' ? '#F87171' :
                       data.guard.level === 'WARNING' ? '#FB923C' : '#7C6FF7'
        }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[var(--color-dim)] text-xs font-semibold mb-1">GUARD STATUS</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">{data.guard.level}</p>
            </div>
          </div>
          {data.guard.threats?.length > 0 && (
            <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
              {data.guard.threats.slice(0, 5).map((threat: string, i: number) => (
                <p key={i} className="text-[var(--color-muted)] text-sm">· {threat}</p>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Confidence Chart */}
      {data?.sparkline && (
        <Card>
          <p className="text-[var(--color-dim)] text-xs font-semibold mb-3">CONFIDENCE · 7 DAYS</p>
          <p className="text-3xl font-bold text-[var(--color-purple)] mb-4">
            {data.sparkline[data.sparkline.length - 1]?.toFixed(1) || '—'}
          </p>
          <div className="flex justify-between gap-1 h-16">
            {data.sparkline.map((val: number, i: number) => {
              const max = Math.max(...data.sparkline);
              const min = Math.min(...data.sparkline);
              const range = max - min || 1;
              const percent = ((val - min) / range) * 100;
              return (
                <div key={i} className="flex-1 bg-[var(--color-surface2)] rounded-sm overflow-hidden">
                  <div
                    className="bg-[var(--color-purple)] w-full transition-all"
                    style={{ height: `${percent}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-[var(--color-dim)] mt-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <span key={i}>{day}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center">
            <p className="text-[var(--color-dim)] text-xs font-semibold mb-2">ENTRIES</p>
            <p className="text-3xl font-bold text-[var(--color-text)]">{data.stats.total_entries || 0}</p>
            <p className="text-[var(--color-muted)] text-xs mt-1">this week</p>
          </Card>
          <Card className="text-center">
            <p className="text-[var(--color-dim)] text-xs font-semibold mb-2">AVG ENERGY</p>
            <p className="text-3xl font-bold text-[var(--color-blue)]">{data.stats.avg_energy?.toFixed(1) || '—'}</p>
            <p className="text-[var(--color-muted)] text-xs mt-1">
              {data.stats.energy_delta > 0 ? '↑' : '↓'} from last week
            </p>
          </Card>
          <Card className="text-center">
            <p className="text-[var(--color-dim)] text-xs font-semibold mb-2">FOLLOW-THROUGH</p>
            <p className="text-3xl font-bold text-[var(--color-green)]">
              {data.stats.commitment_rate ? `${Math.round(data.stats.commitment_rate * 100)}%` : '—'}
            </p>
            <p className="text-[var(--color-muted)] text-xs mt-1">commitments</p>
          </Card>
        </div>
      )}

      {/* Signals */}
      {data?.signals && data.signals.length > 0 && (
        <Card>
          <p className="text-[var(--color-dim)] text-xs font-semibold mb-4">ACTIVE SIGNALS</p>
          <div className="space-y-3">
            {data.signals.map((signal: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-[var(--color-surface2)] rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${(signal.intensity / 10) * 100}%`,
                      backgroundColor: signal.intensity >= 7 ? '#F87171' :
                                       signal.intensity >= 5 ? '#FB923C' : '#7C6FF7'
                    }}
                  />
                </div>
                <p className="text-[var(--color-muted)] text-sm flex-1">
                  {signal.signal_type?.replace(/_/g, ' ')}
                </p>
                <p className="text-[var(--color-muted)] text-xs">·{signal.intensity}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Narrative */}
      {data?.narrative && (
        <>
          <Card>
            <p className="text-[var(--color-dim)] text-xs font-semibold mb-3">HOW YOU'VE BEEN</p>
            <p className="text-[var(--color-muted)] text-sm leading-relaxed">
              {data.narrative.how_youve_been}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
