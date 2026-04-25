'use client';

// Unified auth page — handles both new users and returning users.
// Flow: email → OTP (2 steps, no password)
// New users: register → send_otp → verify_otp → use temp api_key
// Returning users: register (temp) → send_otp (sends to original account) → recover_account → original api_key

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { setApiKey, setUser } from '@/lib/storage';

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-focus OTP input when step changes
  useEffect(() => {
    if (step === 'otp') setTimeout(() => otpRef.current?.focus(), 100);
  }, [step]);

  async function handleEmail() {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Step 1: register to get a temp api_key (idempotent — same email always works)
      const regRes = await axios.post(`${API_URL}/api/mobile/register`, {
        name: 'Monday User',
        email: e,
      });
      const key = regRes.data.api_key;
      setTempApiKey(key);

      // Step 2: send OTP — response tells us if this is a returning user
      const otpRes = await axios.post(
        `${API_URL}/api/mobile/send_otp`,
        { email: e },
        { headers: { 'X-Jarvis-Key': key } }
      );
      setIsReturning(otpRes.data.is_returning_user === true);
      setResendCooldown(60);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp() {
    const code = otp.trim();
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      let finalKey = tempApiKey;
      let userName = 'Monday User';

      if (isReturning) {
        // Returning user: recover_account returns their ORIGINAL api_key
        const res = await axios.post(`${API_URL}/api/mobile/recover_account`, {
          email: email.trim().toLowerCase(),
          otp: code,
        });
        if (!res.data.verified) throw new Error(res.data.error || 'Invalid code');
        finalKey = res.data.api_key;
      } else {
        // New user: verify_otp marks email as verified, use temp key
        const res = await axios.post(
          `${API_URL}/api/mobile/verify_otp`,
          { otp: code },
          { headers: { 'X-Jarvis-Key': tempApiKey } }
        );
        if (!res.data.verified) throw new Error(res.data.error || 'Invalid code');
      }

      // Store auth
      setApiKey(finalKey);
      setUser({ email: email.trim().toLowerCase(), name: userName, id: finalKey });
      router.push('/home');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/mobile/send_otp`,
        { email: email.trim().toLowerCase() },
        { headers: { 'X-Jarvis-Key': tempApiKey } }
      );
      setResendCooldown(60);
    } catch {
      setError('Failed to resend. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-purple-dim)] border border-[var(--color-border-hi)] mb-4">
            <span className="text-2xl font-bold text-[var(--color-purple)]">M</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">Monday</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">The AI that gets smarter about you.</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 justify-center mb-8">
          {(['email', 'otp'] as const).map((s, i) => (
            <div
              key={s}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: s === step ? 24 : 8,
                backgroundColor: i <= (['email','otp'].indexOf(step)) ? 'var(--color-purple)' : 'var(--color-dim)',
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Your email</h2>
                <p className="text-xs text-[var(--color-muted)]">
                  New or returning — just enter your email and we'll send a code.
                </p>
              </div>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && !loading && handleEmail()}
                placeholder="you@example.com"
                autoFocus
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)] focus:outline-none focus:border-[var(--color-purple)] transition-colors"
              />
              {error && <p className="text-xs text-[var(--color-red)]">{error}</p>}
              <button
                onClick={handleEmail}
                disabled={!email.trim() || loading}
                className="w-full py-3 rounded-xl bg-[var(--color-purple)] text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {loading ? 'Sending code…' : 'Continue'}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                  {isReturning ? 'Welcome back' : 'Check your email'}
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  Enter the 6-digit code sent to <span className="text-[var(--color-text)]">{email}</span>.
                </p>
              </div>
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && !loading && otp.length === 6 && handleOtp()}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)] text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-[var(--color-purple)] transition-colors"
              />
              {error && <p className="text-xs text-[var(--color-red)]">{error}</p>}
              <button
                onClick={handleOtp}
                disabled={otp.length !== 6 || loading}
                className="w-full py-3 rounded-xl bg-[var(--color-purple)] text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {loading ? 'Verifying…' : 'Verify'}
              </button>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                  className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  ← Change email
                </button>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-xs text-[var(--color-purple)] disabled:opacity-40 hover:underline transition-opacity"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-[var(--color-dim)] mt-6 tracking-wider">
          YOUR DATA · YOUR DATABASE · NEVER SHARED
        </p>
      </div>
    </div>
  );
}
