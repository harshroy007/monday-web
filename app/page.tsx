'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiKey } from '@/lib/storage';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getApiKey() ? '/home' : '/register');
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-[var(--color-purple)] border-t-transparent animate-spin" />
    </div>
  );
}
