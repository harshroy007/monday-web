'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiKey } from '@/lib/storage';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (getApiKey()) {
      router.push('/home');
    } else {
      router.push('/register');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
      <p className="text-[var(--color-muted)]">Loading...</p>
    </div>
  );
}
