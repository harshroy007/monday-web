'use client';

import { useEffect, useState, useRef } from 'react';
import { Orb } from '@/components/Orb';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/hooks';
import * as api from '@/lib/api';

type OrbState = 'idle' | 'recording' | 'processing' | 'reply';

export default function HomePage() {
  const { user } = useAuth();
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await api.fetchDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVoiceClick() {
    if (orbState === 'idle') {
      fileInputRef.current?.click();
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setOrbState('processing');
    try {
      const response = await api.voiceQuery(file);
      setReplyText(response.reply);
      setOrbState('reply');
      setTimeout(() => setOrbState('idle'), 3000);
    } catch (err) {
      console.error('Voice query failed', err);
      setOrbState('idle');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--color-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
          Hey {user?.name || 'there'}
        </h1>
        <p className="text-[var(--color-muted)]">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Orb */}
      <div className="flex justify-center mb-8">
        <Orb state={orbState} onClick={handleVoiceClick} />
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {/* Reply Card */}
      {replyText && (
        <Card className="mb-6">
          <p className="text-[var(--color-dim)] text-sm mb-2">Monday says</p>
          <p className="text-[var(--color-text)]">{replyText}</p>
        </Card>
      )}

      {/* Guard Status */}
      {dashboardData?.guard && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--color-dim)] text-sm mb-1">GUARD STATUS</p>
              <p className="text-[var(--color-text)] font-semibold">{dashboardData.guard.level}</p>
            </div>
            <div
              className="w-8 h-8 rounded-full"
              style={{
                backgroundColor: dashboardData.guard.level === 'CRITICAL'
                  ? '#F87171'
                  : dashboardData.guard.level === 'WARNING'
                  ? '#FB923C'
                  : '#7C6FF7'
              }}
            />
          </div>
          {dashboardData.guard.threats?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-1">
              {dashboardData.guard.threats.slice(0, 3).map((threat: string, i: number) => (
                <p key={i} className="text-[var(--color-muted)] text-sm">· {threat}</p>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Confidence Sparkline */}
      {dashboardData?.sparkline && dashboardData.sparkline.length > 0 && (
        <Card className="mb-6">
          <p className="text-[var(--color-dim)] text-xs mb-2">CONFIDENCE · 7 DAYS</p>
          <p className="text-2xl font-bold text-[var(--color-purple)] mb-3">
            {dashboardData.sparkline[dashboardData.sparkline.length - 1]?.toFixed(1) || '—'}
          </p>
          <div className="flex justify-between text-xs text-[var(--color-dim)]">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <span key={i}>{day}</span>
            ))}
          </div>
          <div className="flex justify-between gap-1 mt-2 h-12">
            {dashboardData.sparkline.map((val: number, i: number) => {
              const max = Math.max(...dashboardData.sparkline);
              const min = Math.min(...dashboardData.sparkline);
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
        </Card>
      )}

      {/* Stats */}
      {dashboardData?.stats && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          <Card className="text-center">
            <p className="text-[var(--color-dim)] text-xs mb-1">ENTRIES</p>
            <p className="text-xl font-bold text-[var(--color-text)]">{dashboardData.stats.total_entries || '—'}</p>
          </Card>
          <Card className="text-center">
            <p className="text-[var(--color-dim)] text-xs mb-1">AVG ENERGY</p>
            <p className="text-xl font-bold text-[var(--color-blue)]">{dashboardData.stats.avg_energy?.toFixed(1) || '—'}</p>
          </Card>
          <Card className="text-center">
            <p className="text-[var(--color-dim)] text-xs mb-1">FOLLOW-THROUGH</p>
            <p className="text-xl font-bold text-[var(--color-green)]">
              {dashboardData.stats.commitment_rate ? `${Math.round(dashboardData.stats.commitment_rate * 100)}%` : '—'}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
