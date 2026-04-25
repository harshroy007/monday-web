'use client';

import { useState, useEffect, useRef } from 'react';
import { getApiKey } from '@/lib/storage';
import { API_URL, ENDPOINTS } from '@/lib/constants';
import axios from 'axios';

interface Msg {
  role: 'user' | 'monday';
  text: string;
  time: string;
}

function apiHeaders() {
  return { 'X-Jarvis-Key': getApiKey() ?? '', 'Content-Type': 'application/json' };
}

function now() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function ChatPage() {
  const [msgs, setMsgs]     = useState<Msg[]>([]);
  const [input, setInput]   = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const [convRes, inboxRes] = await Promise.allSettled([
          axios.get(`${API_URL}${ENDPOINTS.CONVERSATION}`, { headers: apiHeaders() }),
          axios.get(`${API_URL}${ENDPOINTS.MESSAGES}`,    { headers: apiHeaders() }),
        ]);
        const items: Msg[] = [];
        if (convRes.status === 'fulfilled') {
          for (const t of (convRes.value.data.turns || [])) {
            items.push({ role: t.role === 'jarvis' ? 'monday' : 'user', text: t.text || t.content || '', time: t.at || t.created_at || '' });
          }
        }
        if (inboxRes.status === 'fulfilled') {
          for (const m of (inboxRes.value.data.messages || [])) {
            items.push({ role: 'monday', text: m.body, time: m.at || m.created_at || '' });
          }
          // Mark read
          axios.post(`${API_URL}${ENDPOINTS.MESSAGES}/read`, {}, { headers: apiHeaders() }).catch(() => {});
        }
        // Sort by time
        items.sort((a, b) => (a.time < b.time ? -1 : 1));
        setMsgs(items);
      } catch {}
      setLoading(false);
    }
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const userMsg: Msg = { role: 'user', text, time: now() };
    setMsgs(p => [...p, userMsg]);
    setSending(true);
    try {
      const res = await axios.post(
        `${API_URL}${ENDPOINTS.CHAT}`,
        { message: text },
        { headers: apiHeaders() }
      );
      const reply = res.data.reply || res.data.response || '…';
      setMsgs(p => [...p, { role: 'monday', text: reply, time: now() }]);
    } catch (e: any) {
      setMsgs(p => [...p, { role: 'monday', text: 'Something went wrong. Try again.', time: now() }]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="w-8 h-8 rounded-full bg-[var(--color-purple-dim)] border border-[var(--color-border-hi)] flex items-center justify-center">
          <span className="text-xs font-bold text-[var(--color-purple)]">M</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Monday</p>
          <p className="text-[10px] text-[var(--color-muted)]">Your AI chief-of-staff</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--color-purple)] border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && msgs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--color-muted)]">Say something to Monday.</p>
            <p className="text-xs text-[var(--color-dim)] mt-1">Try: "What's on my plate today?"</p>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[80%] px-4 py-2.5 rounded-2xl"
              style={{
                backgroundColor: m.role === 'user' ? 'var(--color-purple-dim)' : 'var(--color-surface)',
                border: `1px solid ${m.role === 'user' ? 'var(--color-border-hi)' : 'var(--color-border)'}`,
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              }}
            >
              <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{m.text}</p>
              <p className="text-[10px] text-[var(--color-dim)] mt-1 text-right">{m.time}</p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]" style={{ borderRadius: '16px 16px 16px 4px' }}>
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--color-purple)] animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-14 left-0 right-0 max-w-2xl mx-auto px-4 pb-2 bg-[var(--color-bg)] border-t border-[var(--color-border)]">
        <div className="flex gap-2 items-end pt-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Monday…"
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-dim)] text-sm resize-none focus:outline-none focus:border-[var(--color-purple)] transition-colors leading-relaxed"
            style={{ maxHeight: 120 }}
            autoFocus
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="px-4 py-2.5 rounded-xl bg-[var(--color-purple)] text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-[var(--color-dim)] text-center mt-1">Shift+Enter for new line</p>
      </div>
    </div>
  );
}
