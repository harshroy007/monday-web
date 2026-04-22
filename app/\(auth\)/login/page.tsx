'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/lib/hooks';
import * as api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEmail() {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.sendOtp(email);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOtp() {
    if (!otp.trim()) {
      setError('Please enter the OTP code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await login(email, otp);
      router.push('/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Welcome Back</h1>
        <p className="text-[var(--color-muted)] mb-6">Sign in to your Monday account</p>

        {step === 'email' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-dim)] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-dim)]"
              />
            </div>
            {error && <p className="text-[var(--color-red)] text-sm">{error}</p>}
            <Button onClick={handleEmail} isLoading={isLoading} className="w-full">
              Send Code
            </Button>
            <Link
              href="/register"
              className="text-[var(--color-purple)] text-sm w-full py-2 text-center block hover:opacity-80"
            >
              Create new account
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[var(--color-muted)] text-sm">We've sent a 6-digit code to {email}</p>
            <div>
              <label className="block text-sm font-medium text-[var(--color-dim)] mb-1">OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.toUpperCase())}
                placeholder="000000"
                maxLength={6}
                className="w-full px-3 py-2 text-center tracking-widest bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-dim)] font-mono"
              />
            </div>
            {error && <p className="text-[var(--color-red)] text-sm">{error}</p>}
            <Button onClick={handleOtp} isLoading={isLoading} className="w-full">
              Verify
            </Button>
            <button
              onClick={() => setStep('email')}
              className="text-[var(--color-purple)] text-sm w-full py-2 hover:opacity-80"
            >
              Back
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
