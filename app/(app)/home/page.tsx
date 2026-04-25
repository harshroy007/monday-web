'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getApiKey, getUser } from '@/lib/storage';
import { API_URL, ENDPOINTS } from '@/lib/constants';
import axios from 'axios';

type OrbState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

function apiKey() { return getApiKey() ?? ''; }

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getSupportedMimeType() {
  const types = ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus','audio/wav'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
}

const MOOD_COLOR: Record<string, string> = {
  positive: '#4ADE80', happy: '#4ADE80', excited: '#4ADE80', focused: '#60A5FA',
  neutral: '#EEEDF8', calm: '#60A5FA',
  negative: '#F87171', frustrated: '#FB923C', anxious: '#FB923C', stressed: '#F87171',
  mixed: '#FB923C',
};

function moodColor(mood: string) {
  const m = (mood || '').toLowerCase();
  for (const [k, v] of Object.entries(MOOD_COLOR)) if (m.includes(k)) return v;
  return '#EEEDF8';
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono" style={{ color }}>{value}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-surface2)]">
        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${value * 10}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [orbState, setOrbState]     = useState<OrbState>('idle');
  const [result, setResult]         = useState<any>(null);
  const [brief, setBrief]           = useState('');
  const [latestEntry, setLatest]    = useState<any>(null);
  const [actions, setActions]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [permError, setPermError]   = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const vadFrameRef      = useRef<number | null>(null);
  const silenceStartRef  = useRef<number | null>(null);
  const hasSpeechRef     = useRef(false);

  const user = getUser();

  useEffect(() => {
    async function load() {
      try {
        const [briefRes, dashRes, actionsRes] = await Promise.allSettled([
          axios.get(`${API_URL}${ENDPOINTS.BRIEF}`,     { headers: { 'X-Jarvis-Key': apiKey() } }),
          axios.get(`${API_URL}${ENDPOINTS.DASHBOARD}`, { headers: { 'X-Jarvis-Key': apiKey() } }),
          axios.get(`${API_URL}${ENDPOINTS.ACTIONS}`,   { headers: { 'X-Jarvis-Key': apiKey() } }),
        ]);
        if (briefRes.status === 'fulfilled')   setBrief(briefRes.value.data.brief || '');
        if (dashRes.status === 'fulfilled')    setLatest(dashRes.value.data.latest || null);
        if (actionsRes.status === 'fulfilled') {
          const d = actionsRes.value.data;
          setActions([...(d.commitments || []).slice(0, 3), ...(d.upcoming_events || []).slice(0, 2)]);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => { return () => stopVAD(); }, []);

  function stopVAD() {
    if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
    audioCtxRef.current?.close();
    vadFrameRef.current = null; audioCtxRef.current = null; analyserRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
  }

  function startVAD(stream: MediaStream) {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.4;
    ctx.createMediaStreamSource(stream).connect(analyser);
    audioCtxRef.current = ctx; analyserRef.current = analyser;
    hasSpeechRef.current = false; silenceStartRef.current = null;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const THRESHOLD = 8, SILENCE_MS = 1800;

    function tick() {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / data.length) * 100;

      if (rms > THRESHOLD) { hasSpeechRef.current = true; silenceStartRef.current = null; }
      else if (hasSpeechRef.current) {
        if (!silenceStartRef.current) silenceStartRef.current = Date.now();
        if (Date.now() - silenceStartRef.current > SILENCE_MS) { stopRecording(); return; }
      }
      vadFrameRef.current = requestAnimationFrame(tick);
    }
    vadFrameRef.current = requestAnimationFrame(tick);
  }

  async function startRecording() {
    setPermError(''); setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: getSupportedMimeType() });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = handleStop;
      mr.start(200);
      startVAD(stream);
      setOrbState('recording');
    } catch {
      setPermError('Microphone access denied. Allow mic in browser settings.');
      setOrbState('error');
    }
  }

  function stopRecording() {
    stopVAD();
    mediaRecorderRef.current?.stop();
    setOrbState('processing');
  }

  async function handleStop() {
    const mime = getSupportedMimeType();
    const ext  = mime.includes('webm') ? 'webm' : mime.includes('mp4') ? 'mp4' : 'wav';
    const blob = new Blob(chunksRef.current, { type: mime });
    const form = new FormData();
    form.append('audio', blob, `recording.${ext}`);

    try {
      const res = await axios.post(`${API_URL}/api/analyze_conversation`, form, {
        headers: { 'X-Jarvis-Key': apiKey() },
      });
      setResult(res.data);
      setLatest({
        mood: res.data.entry?.mood,
        confidence: res.data.entry?.confidence,
        energy: res.data.entry?.energy,
        insight: res.data.entry?.key_insight,
        at: new Date().toLocaleString(),
      });
      setOrbState('done');
    } catch (e: any) {
      setResult({ error: e.response?.data?.error || 'Analysis failed. Try again.' });
      setOrbState('error');
    }
  }

  function handleOrbClick() {
    if (orbState === 'processing') return;
    if (orbState === 'recording') { stopRecording(); return; }
    startRecording();
  }

  const mc = moodColor(result?.entry?.mood || latestEntry?.mood || '');
  const orbColor = {
    idle: 'var(--color-purple)', recording: 'var(--color-red)',
    processing: 'var(--color-purple)', done: 'var(--color-green)', error: 'var(--color-red)',
  }[orbState];

  return (
    <div className="min-h-full px-4 pt-6 pb-4">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase">{greeting()}</p>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight mt-0.5">
            {user?.name && user.name !== 'Monday User' ? user.name : 'Monday'}
          </h1>
        </div>
        {latestEntry?.mood && (
          <div className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${moodColor(latestEntry.mood)}18`, color: moodColor(latestEntry.mood), border: `1px solid ${moodColor(latestEntry.mood)}44` }}>
            {latestEntry.mood}
          </div>
        )}
      </div>

      {/* Brief */}
      {brief && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-5">
          <p className="text-[10px] text-[var(--color-purple)] tracking-widest uppercase mb-2">MONDAY'S READ ON YOU</p>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">{brief}</p>
        </div>
      )}

      {/* Orb — center of the screen */}
      <div className="flex flex-col items-center py-6">
        <button
          onClick={handleOrbClick}
          disabled={orbState === 'processing'}
          className="relative flex items-center justify-center focus:outline-none"
          style={{ width: 140, height: 140 }}
        >
          {orbState === 'recording' && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: orbColor }} />
          )}
          <span className="w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500"
            style={{
              background: `radial-gradient(circle at 40% 35%, ${orbColor}44, ${orbColor}11)`,
              border: `1.5px solid ${orbColor}66`,
              boxShadow: orbState === 'recording'
                ? `0 0 0 10px ${orbColor}15, 0 0 60px ${orbColor}44`
                : `0 0 40px ${orbColor}22`,
            }}>
            <span className="w-20 h-20 rounded-full transition-all duration-300"
              style={{ background: `radial-gradient(circle at 40% 35%, ${orbColor}66, ${orbColor}22)`, border: `1px solid ${orbColor}` }} />
          </span>
        </button>

        <p className="text-xs text-[var(--color-muted)] mt-3">
          {orbState === 'idle' && 'Tap to speak'}
          {orbState === 'recording' && 'Listening… tap to stop'}
          {orbState === 'processing' && 'Analysing…'}
          {orbState === 'done' && 'Tap to record again'}
          {orbState === 'error' && 'Tap to retry'}
        </p>

        {orbState === 'processing' && (
          <div className="flex gap-1.5 mt-2">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--color-purple)] animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
            ))}
          </div>
        )}
        {permError && <p className="text-xs text-[var(--color-red)] mt-2 text-center max-w-xs">{permError}</p>}
      </div>

      {/* Result card after recording */}
      {result && !result.error && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-hi)] p-4 mb-4 space-y-4">
          {/* What you said */}
          {result.transcript && (
            <div>
              <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-1">YOU SAID</p>
              <p className="text-sm text-[var(--color-text)] italic leading-relaxed">"{result.transcript}"</p>
            </div>
          )}

          {/* Scores */}
          {result.entry && (
            <div className="space-y-3 border-t border-[var(--color-border)] pt-3">
              <ScoreBar label="Mood" value={result.entry.confidence} color={moodColor(result.entry.mood)} />
              <ScoreBar label="Confidence" value={result.entry.confidence} color="var(--color-purple)" />
              <ScoreBar label="Energy" value={result.entry.energy} color="var(--color-green)" />
            </div>
          )}

          {/* Key insight */}
          {result.entry?.key_insight && (
            <div className="bg-[var(--color-surface2)] rounded-xl p-3 border-t border-[var(--color-border)]">
              <p className="text-[10px] text-[var(--color-purple)] tracking-widest uppercase mb-1">KEY INSIGHT</p>
              <p className="text-sm text-[var(--color-text)] font-medium leading-relaxed">{result.entry.key_insight}</p>
            </div>
          )}

          {/* Debrief */}
          {result.debrief?.what_happened && (
            <div className="border-t border-[var(--color-border)] pt-3 space-y-3">
              <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase">MONDAY'S TAKE</p>
              {result.debrief.what_happened && <p className="text-sm text-[var(--color-text)] leading-relaxed">{result.debrief.what_happened}</p>}
              {result.debrief.did_well && (
                <div className="flex gap-2">
                  <span className="text-[var(--color-green)] text-xs mt-0.5 flex-shrink-0">↑</span>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">{result.debrief.did_well}</p>
                </div>
              )}
              {result.debrief.next && (
                <div className="flex gap-2">
                  <span className="text-[var(--color-purple)] text-xs mt-0.5 flex-shrink-0">→</span>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">{result.debrief.next}</p>
                </div>
              )}
            </div>
          )}

          {/* Guard */}
          {result.guard?.threats?.length > 0 && (
            <div className="border-t border-[var(--color-border)] pt-3">
              <p className="text-[10px] text-[var(--color-red)] tracking-widest uppercase mb-2">GUARD FLAGGED</p>
              {result.guard.threats.slice(0, 2).map((t: any, i: number) => (
                <div key={i} className="flex gap-2 mb-1">
                  <span className="text-xs text-[var(--color-red)] flex-shrink-0">⚠</span>
                  <p className="text-xs text-[var(--color-muted)]">{t.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result?.error && (
        <div className="bg-[var(--color-red)]11 rounded-xl border border-[var(--color-red)]44 px-4 py-3 mb-4">
          <p className="text-sm text-[var(--color-red)]">{result.error}</p>
        </div>
      )}

      {/* Last entry (if no new recording) */}
      {!result && latestEntry && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase">LAST SESSION</p>
            <span className="text-[10px] text-[var(--color-dim)] font-mono">{latestEntry.at}</span>
          </div>
          {latestEntry.insight && <p className="text-sm text-[var(--color-text)] leading-relaxed mb-3">"{latestEntry.insight}"</p>}
          <div className="flex gap-4">
            {latestEntry.mood && (
              <div className="text-center">
                <p className="text-[10px] text-[var(--color-muted)] mb-1">MOOD</p>
                <p className="text-xs font-medium" style={{ color: moodColor(latestEntry.mood) }}>{latestEntry.mood}</p>
              </div>
            )}
            {latestEntry.energy != null && (
              <div className="text-center">
                <p className="text-[10px] text-[var(--color-muted)] mb-1">ENERGY</p>
                <p className="text-xs font-mono text-[var(--color-green)]">{latestEntry.energy}/10</p>
              </div>
            )}
            {latestEntry.confidence != null && (
              <div className="text-center">
                <p className="text-[10px] text-[var(--color-muted)] mb-1">CONFIDENCE</p>
                <p className="text-xs font-mono text-[var(--color-purple)]">{latestEntry.confidence}/10</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commitments */}
      {actions.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-4">
          <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-3">ON YOUR PLATE</p>
          {actions.map((a: any, i: number) => (
            <div key={i} className="flex gap-3 items-start mb-2.5 last:mb-0">
              <span className="text-[var(--color-purple)] mt-0.5 flex-shrink-0">·</span>
              <p className="text-sm text-[var(--color-text)] leading-relaxed">{a.commitment_text || a.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chat CTA */}
      <a href="/chat" className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[var(--color-purple-dim)] border border-[var(--color-border-hi)] text-sm text-[var(--color-purple)] font-medium hover:opacity-80 transition-opacity mb-2">
        <span>Chat with Monday</span>
        <span>→</span>
      </a>
    </div>
  );
}
