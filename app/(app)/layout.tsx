'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getApiKey } from '@/lib/storage';

const NAV = [
  { href: '/home',      label: 'Home',      icon: '◎' },
  { href: '/chat',      label: 'Chat',      icon: '⌁' },
  { href: '/dashboard', label: 'Intel',     icon: '⊞' },
  { href: '/profile',   label: 'Profile',   icon: '○' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path   = usePathname();

  useEffect(() => {
    if (!getApiKey()) router.replace('/register');
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col max-w-2xl mx-auto">
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-[var(--color-surface)] border-t border-[var(--color-border)] flex">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-3 gap-0.5"
              style={{ color: active ? 'var(--color-purple)' : 'var(--color-dim)' }}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px] tracking-wider font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
