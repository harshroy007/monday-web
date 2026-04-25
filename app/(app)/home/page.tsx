'use client';

import { useState, useEffect, useRef } from 'react';
import { getApiKey, getUser } from '@/lib/storage';
import { API_URL, ENDPOINTS } from '@/lib/constants';
import axios from 'axios';

type OrbState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

function apiHeaders() {
  return { 'X-Jarvis-Key': getApiKey() ?? '' };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const [orbState, setOrbState]   = useState<OrbState>('idle');
  const [transcript, setTranscript] = useState('');
  const [reply, setReply]           = useState('');
  const [brief, setBrief]           = useState('');
  const [actions, setActions]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [permError, setPermError]   = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const silenceTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const user = getUser();

  useEffect(() => {
    async function load() {
      try {
        const [briefRes, actionsRes] = await Promise.allSettled([
          axios.get(`${API_URL}${ENDPOINTS.BRIEF}`,   { headers: apiHeaders() }),
          axios.get(`${API_URL}${ENDPOINTS.ACTIONS}`, { headers: apiHeaders() }),
        ]);
        if (briefRes.status === 'fulfilled')   setBrief(briefRes.value.data.brief || '');
        if (actionsRes.status === 'fulfilled') {
          const d = actionsRes.value.data;
          setActions([...(d.commitments || []).slice(0, 3), ...(d.upcoming_events || []).slice(0, 2)]);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, []);

  async function startRecording() {
    setPermError('');
    setTranscript('');
    setReply('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mr = new MediaRecorder(stream, { mimeType: getSupportedMimeType() });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = handleRecordingStop;
      mr.start(200);
      setOrbState('recording');

      // Auto-stop after 30s
      silenceTimer.current = setTimeout(() => stopRecording(), 30000);
    } catch (e: any) {
      setPermError('Microphone access denied. Allow mic in browser settings.');
      setOrbState('error');
    }
  }

  function stopRecording() {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setOrbState('processing');
  }

  async function handleRecordingStop() {
    const mimeType = getSupportedMimeType();
    const ext      = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav';
    const blob     = new Blob(chunksRef.current, { type: mimeType });

    const form = new FormData();
    form.append('audio', blob, `recording.${ext}`);

    try {
      const res = await axios.post(`${API_URL}${ENDPOINTS.VOICE_QUERY}`, form, {
        headers: { 'X-Jarvis-Key': getApiKey() ?? '' },
      });
      setTranscript(res.data.transcript || '');
      setReply(res.data.reply || res.data.response || '');
      setOrbState('done');
    } catch (e: any) {
      setReply('Something went wrong. Try again.');
      setOrbState('error');
    }
  }

  function handleOrbClick() {
    if (orbState === 'recording') { stopRecording(); return; }
    if (orbState === 'idle' || orbState === 'done' || orbState === 'error') { startRecording(); return; }
  }

  const orbColor = {
    idle:       'var(--color-purple)',
    recording:  'var(--color-red)',
    processing: 'var(--color-purple)',
    done:       'var(--color-green)',
    error:      'var(--color-red)',
  }[orbState];

  const orbLabel = {
    idle:       'Tap to speak',
    recording:  'Tap to stop',
    processing: 'Processing…',
    done:       'Tap to speak again',
    error:      'Tap to retry',
  }[orbState];

  return (
    <div className="min-h-full flex flex-col px-4 pt-8">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-xs text-[var(--color-muted)] tracking-widest uppercase mb-1">{greeting()}</p>
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
          {user?.name && user.name !== 'Monday User' ? user.name : 'Welcome'}
        </h1>
      </div>

      {/* Brief */}
      {!loading && brief && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-5">
          <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-2">MONDAY'S BRIEF</p>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">{brief}</p>
        </div>
      )}

      {/* Orb */}
      <div className="flex flex-col items-center my-6">
        <button
          onClick={handleOrbClick}
          disabled={orbState === 'processing'}
          className="relative flex items-center justify-center transition-all duration-300 focus:outline-none"
          style={{ width: 120, height: 120 }}
        >
          {/* Pulse ring when recording */}
          {orbState === 'recording' && (
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ backgroundColor: `${orbColor}22` }}
            />
          )}
          <span
            className="w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor: `${orbColor}18`,
              border: `2px solid ${orbColor}55`,
              boxShadow: orbState === 'recording'
                ? `0 0 0 8px ${orbColor}18, 0 0 40px ${orbColor}44`
                : `0 0 30px ${orbColor}22`,
            }}
          >
            <span
              className="w-16 h-16 rounded-full transition-all duration-300"
              style={{ backgroundColor: `${orbColor}30`, border: `2px solid ${orbColor}88` }}
            />
          </span>
        </button>

        <p className="text-xs text-[var(--color-muted)] mt-3 transition-all">{orbLabel}</p>

        {orbState === 'processing' && (
          <div className="flex gap-1 mt-2">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--color-purple)] animate-bounce"
                style={{ animationDelay: `${i*150}ms` }} />
            ))}
          </div>
        )}

        {permError && (
          <p className="text-xs text-[var(--color-red)] mt-2 text-center max-w-xs">{permError}</p>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="bg-[var(--color-surface2)] rounded-xl border border-[var(--color-border)] px-4 py-3 mb-3">
          <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-1">YOU SAID</p>
          <p className="text-sm text-[var(--color-text)] italic">"{transcript}"</p>
        </div>
      )}

      {/* Reply */}
      {reply && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-hi)] p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-[var(--color-purple-dim)] border border-[var(--color-border-hi)] flex items-center justify-center">
              <span className="text-[8px] font-bold text-[var(--color-purple)]">M</span>
            </div>
            <p className="text-[10px] text-[var(--color-purple)] tracking-widest uppercase">MONDAY</p>
          </div>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">{reply}</p>
        </div>
      )}

      {/* Chat link */}
      <a
        href="/chat"
        className="w-full py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center text-sm text-[var(--color-purple)] font-medium mb-4 block hover:border-[var(--color-border-hi)] transition-colors"
      >
        Chat with Monday →
      </a>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-4">
          <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-3">ON YOUR PLATE</p>
          {actions.map((a: any, i: number) => (
            <div key={i} className="flex gap-3 items-start mb-3 last:mb-0">
              <span className="text-[var(--color-purple)] text-xs mt-0.5">•</span>
              <p className="text-sm text-[var(--color-text)] leading-relaxed flex-1">
                {a.commitment_text || a.description || '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
}
