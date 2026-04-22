'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/lib/hooks';
import * as api from '@/lib/api';
import { setApiKey } from '@/lib/storage';
import axios from 'axios';
import { API_URL, ENDPOINTS } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const { setApiKeyAndUser } = useAuth();
  const [step, setStep] = useState<'name-email' | 'otp'>('name-email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempApiKey, setTempApiKey] = useState<string | null>(null);

  async function handleNameEmail() {
    if (!name.trim() || !email.trim()) {
      setError('Please fill in both fields');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Step 1: Register user with name to get API key
      const registerRes = await axios.post(`${API_URL}${ENDPOINTS.REGISTER}`, { name });
      const newApiKey = registerRes.data.api_key;
      setTempApiKey(newApiKey);

      // Step 2: Send OTP with the new API key
      await axios.post(`${API_URL}${ENDPOINTS.SEND_OTP}`, { email }, {
        headers: { 'X-Jarvis-Key': newApiKey }
      });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
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
      // Step 3: Verify OTP with the temp API key
      const verifyRes = await axios.post(`${API_URL}${ENDPOINTS.VERIFY_OTP}`, { email, otp }, {
        headers: { 'X-Jarvis-Key': tempApiKey }
      });
      const finalApiKey = verifyRes.data.api_key || tempApiKey;
      setApiKey(finalApiKey);
      setApiKeyAndUser(finalApiKey, { id: email, name, email });
      router.push('/home');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Welcome to Monday</h1>
        <p className="text-[var(--color-muted)] mb-6">Your personal AI chief-of-staff</p>

        {step === 'name-email' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-dim)] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What's your name?"
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-dim)]"
              />
            </div>
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
            <Button onClick={handleNameEmail} isLoading={isLoading} className="w-full">
              Continue
            </Button>
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
              onClick={() => setStep('name-email')}
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
