'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/hooks';

type TabType = 'monday' | 'beliefs' | 'patterns' | 'gaps' | 'privacy';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('monday');
  const [wikiData, setWikiData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [privacySummary, setPrivacySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [wiki, profile, privacy] = await Promise.all([
        api.fetchWiki(),
        api.fetchProfile(),
        api.getPrivacySummary(),
      ]);
      setWikiData(wiki);
      setProfileData(profile);
      setPrivacySummary(privacy);
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-[var(--color-muted)]">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Profile</h1>
        <button
          onClick={logout}
          className="text-[var(--color-red)] text-sm hover:opacity-80"
        >
          Logout
        </button>
      </div>

      <Card>
        <p className="text-[var(--color-dim)] text-xs font-semibold mb-2">ACCOUNT</p>
        <p className="text-[var(--color-text)] font-semibold">{user?.name}</p>
        <p className="text-[var(--color-muted)] text-sm">{user?.email}</p>
      </Card>

      {/* Tabs */}
      <div className="border-b border-[var(--color-border)] flex gap-4 overflow-x-auto">
        {['monday', 'beliefs', 'patterns', 'gaps', 'privacy'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as TabType)}
            className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-[var(--color-purple)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-muted)]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'monday' && (
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-[var(--color-muted)] text-sm whitespace-pre-wrap">
                {wikiData?.user_wiki || 'No data yet.'}
              </p>
            </div>
          </Card>
        )}

        {activeTab === 'beliefs' && (
          <div className="space-y-3">
            {profileData?.beliefs && profileData.beliefs.length > 0 ? (
              profileData.beliefs.map((belief: any, i: number) => (
                <Card key={i}>
                  <p className="text-[var(--color-text)] font-semibold mb-2">{belief.summary}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[var(--color-surface2)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-purple)]"
                        style={{ width: `${belief.confidence * 10}%` }}
                      />
                    </div>
                    <p className="text-[var(--color-muted)] text-xs font-mono">
                      {belief.confidence?.toFixed(1)}
                    </p>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <p className="text-[var(--color-muted)] text-center">No beliefs recorded yet.</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-3">
            {profileData?.patterns && profileData.patterns.length > 0 ? (
              profileData.patterns.map((pattern: any, i: number) => (
                <Card key={i}>
                  <p className="text-[var(--color-text)] font-semibold mb-2">{pattern.name}</p>
                  <p className="text-[var(--color-muted)] text-sm mb-1"><strong>Trigger:</strong> {pattern.trigger}</p>
                  <p className="text-[var(--color-muted)] text-sm"><strong>Pattern:</strong> {pattern.consequence}</p>
                </Card>
              ))
            ) : (
              <Card>
                <p className="text-[var(--color-muted)] text-center">No patterns identified yet.</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'gaps' && (
          <div className="space-y-3">
            {profileData?.gaps && profileData.gaps.length > 0 ? (
              profileData.gaps.map((gap: any, i: number) => (
                <Card key={i}>
                  <div className="flex justify-between items-start">
                    <p className="text-[var(--color-text)] font-semibold">{gap.title}</p>
                    <span className="text-xs bg-[var(--color-red)] bg-opacity-20 text-[var(--color-red)] px-2 py-1 rounded">
                      Severity: {gap.severity}
                    </span>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <p className="text-[var(--color-muted)] text-center">No gaps identified.</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'privacy' && (
          <Card>
            <p className="text-[var(--color-dim)] text-xs font-semibold mb-4">DATA STORED</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[var(--color-muted)] text-xs">Beliefs</p>
                <p className="text-2xl font-bold text-[var(--color-purple)]">{privacySummary?.beliefs_count || 0}</p>
              </div>
              <div>
                <p className="text-[var(--color-muted)] text-xs">Patterns</p>
                <p className="text-2xl font-bold text-[var(--color-purple)]">{privacySummary?.patterns_count || 0}</p>
              </div>
              <div>
                <p className="text-[var(--color-muted)] text-xs">People</p>
                <p className="text-2xl font-bold text-[var(--color-purple)]">{privacySummary?.people_count || 0}</p>
              </div>
              <div>
                <p className="text-[var(--color-muted)] text-xs">Decisions</p>
                <p className="text-2xl font-bold text-[var(--color-purple)]">{privacySummary?.decisions_count || 0}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (confirm('This will permanently delete all your data. Are you sure?')) {
                  await api.clearAllData();
                  logout();
                }
              }}
              className="w-full px-4 py-2 bg-[var(--color-red)] bg-opacity-20 text-[var(--color-red)] rounded-lg hover:opacity-80 transition-all"
            >
              Delete All Data
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
