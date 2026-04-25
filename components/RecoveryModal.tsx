'use client';

import { useState } from 'react';
import axios from 'axios';
import { API_URL, ENDPOINTS } from '@/lib/constants';
import { Button } from './Button';
import { Card } from './Card';

type RecoveryStep = 'email' | 'method' | 'phrase' | 'escrow' | 'success';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (apiKey: string) => void;
}

export function RecoveryModal({ isOpen, onClose, onSuccess }: RecoveryModalProps) {
  const [step, setStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [phraseInput, setPhraseInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handlePhraseRecovery() {
    if (!phraseInput.trim()) {
      setError('Enter your backup phrase.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const words = phraseInput.trim().split(/\s+/);
      const result = await axios.post(`${API_URL}/api/mobile/reset_password`, {
        email,
        phrase: words.join(' '),
        new_password: newPassword,
      });
      localStorage.setItem('api_key', result.data.api_key);
      setStep('success');
      setTimeout(() => {
        onSuccess(result.data.api_key);
        handleClose();
      }, 1500);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Recovery failed. Check your phrase and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setStep('email');
    setEmail('');
    setPhraseInput('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <Card className="w-full max-w-md rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            {step === 'email' && 'Recover Account'}
            {step === 'method' && 'Recovery Options'}
            {step === 'phrase' && 'Enter Recovery Phrase'}
            {step === 'escrow' && 'Email Verification'}
            {step === 'success' && 'Account Recovered'}
          </h2>
          {step !== 'success' && (
            <button
              onClick={handleClose}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)] text-2xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* Email step */}
        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Your email address
              </label>
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
            <Button onClick={() => email.trim() && setStep('method')} disabled={!email.trim() || isLoading} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {/* Method selection */}
        {step === 'method' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted)] mb-4">
              How would you like to recover your account?
            </p>

            <button
              onClick={() => setStep('phrase')}
              className="w-full p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-purple)] transition text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">📝</div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">Recovery Phrase</p>
                  <p className="text-xs text-[var(--color-muted)]">Enter your 12-word backup phrase</p>
                </div>
              </div>
              <span className="text-[var(--color-purple)]">→</span>
            </button>

            <button
              disabled
              className="w-full p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] opacity-50 cursor-not-allowed text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">👤</div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">Recovery Contact</p>
                  <p className="text-xs text-[var(--color-muted)]">Ask a trusted contact (coming soon)</p>
                </div>
              </div>
              <span className="text-[var(--color-dim)]">→</span>
            </button>

            <button
              onClick={() => setStep('escrow')}
              className="w-full p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-purple)] transition text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔐</div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">Escrow Backup</p>
                  <p className="text-xs text-[var(--color-muted)]">Retrieve from escrow (coming soon)</p>
                </div>
              </div>
              <span className="text-[var(--color-purple)]">→</span>
            </button>

            <Button onClick={() => setStep('email')} variant="secondary" className="w-full">
              Back
            </Button>
          </div>
        )}

        {/* Phrase recovery */}
        {step === 'phrase' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Enter your backup phrase
              </label>
              <textarea
                value={phraseInput}
                onChange={(e) => { setPhraseInput(e.target.value); setError(''); }}
                placeholder="word1 word2 word3 ... (12 words)"
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)] h-24 font-mono text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Create new password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Confirm new password"
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)]"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              onClick={handlePhraseRecovery}
              disabled={isLoading || !phraseInput.trim()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Recovering...' : 'Recover Account'}
            </Button>

            <Button onClick={() => setStep('method')} variant="secondary" className="w-full">
              Back
            </Button>
          </div>
        )}

        {/* Escrow recovery */}
        {step === 'escrow' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted)]">
              A verification code will be sent to {email}. Enter it to retrieve your encrypted backup.
            </p>
            <p className="text-sm text-[var(--color-muted)] bg-[var(--color-surface)] p-4 rounded-lg">
              Escrow recovery feature coming soon. Use your recovery phrase instead.
            </p>
            <Button onClick={() => setStep('method')} variant="secondary" className="w-full">
              Back
            </Button>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">✓</div>
            <h3 className="text-xl font-bold text-[var(--color-text)]">Account recovered!</h3>
            <p className="text-sm text-[var(--color-muted)]">
              Your account is ready. Redirecting...
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
