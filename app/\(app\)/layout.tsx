'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks';

const TABS = [
  { name: 'Home', href: '/home', icon: '◯' },
  { name: 'Chat', href: '/chat', icon: '💬' },
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Feed', href: '/feed', icon: '📝' },
  { name: 'Profile', href: '/profile', icon: '👤' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { apiKey, init } = useAuth();

  useEffect(() => {
    init();
    if (!apiKey) {
      router.push('/login');
    }
  }, [apiKey, init, router]);

  if (!apiKey) {
    return <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <main className="flex-1 overflow-y-auto pb-20 md:pb-8">{children}</main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--color-border)] bg-[var(--color-bg)] md:hidden">
        <div className="flex justify-around items-center">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 py-3 text-center transition-colors ${
                pathname === tab.href
                  ? 'text-[var(--color-purple)] border-t-2 border-[var(--color-purple)]'
                  : 'text-[var(--color-dim)] hover:text-[var(--color-text)]'
              }`}
            >
              <div className="text-xl">{tab.icon}</div>
              <div className="text-xs mt-1">{tab.name}</div>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Side Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-56 border-r border-[var(--color-border)] bg-[var(--color-bg)] p-4 hidden md:block overflow-y-auto">
        <div className="text-2xl font-bold text-[var(--color-purple)] mb-8">Monday</div>
        <div className="space-y-2">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                pathname === tab.href
                  ? 'bg-[var(--color-surface)] text-[var(--color-purple)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab.icon} {tab.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop main content offset */}
      <style jsx>{`
        @media (min-width: 768px) {
          main {
            margin-left: 224px;
          }
        }
      `}</style>
    </div>
  );
}
