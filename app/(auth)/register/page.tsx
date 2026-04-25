'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { RecoveryModal } from '@/components/RecoveryModal';
import { useAuth } from '@/lib/hooks';
import { API_URL, ENDPOINTS } from '@/lib/constants';
import axios from 'axios';

type RegisterStep = 'name' | 'email' | 'password' | 'phrase' | 'otp' | 'success';

export default function RegisterPage() {
  const router = useRouter();
  const { setApiKeyAndUser } = useAuth();
  const [step, setStep] = useState<RegisterStep>('name');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [backupPhrase, setBackupPhrase] = useState('');
  const [phraseConfirmed, setPhraseConfirmed] = useState(false);
  const [otp, setOtp] = useState('');
  const [showPhrase, setShowPhrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempApiKey, setTempApiKey] = useState<string | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
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
      const checkRes = await axios.post(`${API_URL}/api/mobile/onboarding`, { email, name });
      if (checkRes.data.api_key) {
        setIsReturningUser(true);
        setTempApiKey(checkRes.data.api_key);
        setStep('otp');
      } else {
        setIsReturningUser(false);
        setStep('password');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check email');
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePassword() {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const registerRes = await axios.post(`${API_URL}${ENDPOINTS.REGISTER}`, {
        name,
        email,
        password,
      });
      setTempApiKey(registerRes.data.api_key);
      setBackupPhrase(registerRes.data.backup_phrase);
      setStep('phrase');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePhraseConfirm() {
    if (!phraseConfirmed) {
      setError('Please confirm you have written down the phrase');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/mobile/verify_backup_phrase`, { phrase: backupPhrase }, {
        headers: { 'X-Jarvis-Key': tempApiKey }
      });
      await axios.post(`${API_URL}${ENDPOINTS.SEND_OTP}`, { email }, {
        headers: { 'X-Jarvis-Key': tempApiKey }
      });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify phrase');
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

  const totalSteps = isReturningUser ? 2 : 4;
  const currentStepNumber = {
    name: 1,
    email: 2,
    password: 3,
    phrase: 4,
    otp: isReturningUser ? 2 : 4,
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
                Used for account recovery only. Monday never emails you.
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
              {isLoading ? 'Checking...' : 'Continue'}
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

        {step === 'password' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Create a password
              </label>
              <p className="text-xs text-[var(--color-muted)] mb-3">
                Secure your account. Monday will use it to encrypt your data.
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)]"
                autoFocus
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Confirm password"
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)] mt-2"
              />
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <Button
              onClick={handlePassword}
              disabled={password.length < 8 || confirmPassword !== password || isLoading}
              className="w-full"
            >
              {isLoading ? 'Setting up...' : 'Continue'}
            </Button>
            <Button onClick={() => setStep('email')} variant="secondary" className="w-full">
              Back
            </Button>
          </div>
        )}

        {step === 'phrase' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Save your recovery phrase
              </label>
              <p className="text-xs text-[var(--color-muted)] mb-3">
                Write down these 12 words in order. You'll need them if you forget your password.
              </p>

              <div
                className={`p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] mb-4 cursor-pointer`}
                onClick={() => setShowPhrase(!showPhrase)}
              >
                <div className="grid grid-cols-3 gap-2">
                  {backupPhrase.split(' ').map((word, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--color-muted)]">{i + 1}</span>
                      <span className="text-[var(--color-text)] font-mono font-semibold">
                        {showPhrase ? word : '••••'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--color-purple)] mt-3 text-center">
                  {showPhrase ? 'Click to hide' : 'Click to reveal'}
                </p>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={phraseConfirmed}
                  onChange={(e) => { setPhraseConfirmed(e.target.checked); setError(''); }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-[var(--color-text)]">
                  I have written down these words in order
                </span>
              </label>

              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <Button
              onClick={handlePhraseConfirm}
              disabled={!phraseConfirmed || isLoading}
              className="w-full"
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
            <Button onClick={() => setStep('password')} variant="secondary" className="w-full">
              Back
            </Button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Verify your email
              </label>
              <p className="text-xs text-[var(--color-muted)] mb-3">
                We sent a 6-digit code to {email}
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => { setOtp(e.target.value); setError(''); }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)] text-center font-mono text-2xl tracking-widest"
                autoFocus
              />
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <Button onClick={handleOtp} disabled={otp.length !== 6 || isLoading} className="w-full">
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
            {!isReturningUser && (
              <Button onClick={() => setStep('phrase')} variant="secondary" className="w-full">
                Back
              </Button>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✓</div>
            <h2 className="text-xl font-bold text-[var(--color-text)]">Welcome to Monday!</h2>
            <p className="text-sm text-[var(--color-muted)]">
              Setting up your account...
            </p>
          </div>
        )}
      </Card>

      <RecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onSuccess={handleRecoverySuccess}
      />
    </div>
  );
}
