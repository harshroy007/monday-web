'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { RecoveryModal } from '@/components/RecoveryModal';
import { useAuth } from '@/lib/hooks';
import { API_URL, ENDPOINTS } from '@/lib/constants';
import axios from 'axios';

type RegisterStep = 'name' | 'email' | 'otp' | 'success';

export default function RegisterPage() {
  const router = useRouter();
  const { setApiKeyAndUser } = useAuth();
  const [step, setStep] = useState<RegisterStep>('name');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempApiKey, setTempApiKey] = useState<string | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  async function handleName() {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    setStep('email');
  }

  async function handleEmail() {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const registerRes = await axios.post(`${API_URL}${ENDPOINTS.REGISTER}`, {
        name,
        email,
      });
      setTempApiKey(registerRes.data.api_key);

      const otpRes = await axios.post(`${API_URL}/api/mobile/send_otp`, { email }, {
        headers: { 'X-Jarvis-Key': registerRes.data.api_key }
      });

      if (otpRes.data.sent) {
        setStep('otp');
      }
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
      const verifyRes = await axios.post(`${API_URL}${ENDPOINTS.VERIFY_OTP}`, { email, otp }, {
        headers: { 'X-Jarvis-Key': tempApiKey }
      });
      const finalApiKey = verifyRes.data.api_key || tempApiKey;
      localStorage.setItem('api_key', finalApiKey);
      setApiKeyAndUser(finalApiKey, { id: email, name, email });
      setStep('success');
      setTimeout(() => router.push('/home'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRecoverySuccess(apiKey: string) {
    setApiKeyAndUser(apiKey, { id: email, name, email });
    router.push('/home');
  }

  const totalSteps = 3;
  const currentStepNumber = {
    name: 1,
    email: 2,
    otp: 3,
    success: totalSteps,
  }[step];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Welcome to Monday</h1>
        <p className="text-[var(--color-muted)] mb-6">Your personal AI chief-of-staff</p>

        {step !== 'success' && (
          <div className="flex gap-2 mb-6 justify-center">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i < currentStepNumber ? 'bg-[var(--color-purple)] w-6' : 'bg-[var(--color-border)] w-2'
                }`}
              />
            ))}
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                What should Monday call you?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Your first name"
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)]"
                autoFocus
              />
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <Button onClick={handleName} disabled={!name.trim() || isLoading} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Your email
              </label>
              <p className="text-xs text-[var(--color-muted)] mb-3">
                We'll send you a verification code.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)]"
                autoFocus
              />
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <Button onClick={handleEmail} disabled={!email.trim() || isLoading} className="w-full">
              {isLoading ? 'Sending code...' : 'Continue'}
            </Button>
            <Button onClick={() => setStep('name')} variant="secondary" className="w-full">
              Back
            </Button>
            <button
              onClick={() => setShowRecoveryModal(true)}
              className="w-full text-sm text-[var(--color-purple)] hover:underline text-center py-2"
            >
              Can't recover your account?
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Verification code
              </label>
              <p className="text-xs text-[var(--color-muted)] mb-3">
                Check your email for a 6-digit code.
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => { setOtp(e.target.value); setError(''); }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)] text-center text-lg tracking-widest"
                autoFocus
              />
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <Button onClick={handleOtp} disabled={!otp.trim() || isLoading} className="w-full">
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
            <Button onClick={() => setStep('email')} variant="secondary" className="w-full">
              Back
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="text-4xl">✨</div>
            <p className="text-[var(--color-text)] font-medium">Welcome aboard, {name}!</p>
            <p className="text-sm text-[var(--color-muted)]">Setting up your account...</p>
          </div>
        )}

        {showRecoveryModal && (
          <RecoveryModal
            onClose={() => setShowRecoveryModal(false)}
            onSuccess={handleRecoverySuccess}
          />
        )}
      </Card>
    </div>
  );
}
