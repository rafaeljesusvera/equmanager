'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MicrophoneStageIcon,
  PaperPlaneTiltIcon,
  SparkleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: {
    type: string;
    summary: string;
    link?: string;
  };
};

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hola, soy tu asistente de Equmanager. Puedes pedirme que programe una clase, dé de alta un caballo, añada feedback a un alumno o registre el cuidado de un caballo. ¿En qué te ayudo hoy?',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  lesson_created: <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />,
  horse_created: <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />,
  event_created: <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />,
  feedback_added: <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />,
  care_logged: <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />,
  error: <WarningCircleIcon size={14} weight="fill" className="text-red-500" />,
};

function ActionCard({ action }: { action: NonNullable<Message['action']> }) {
  const isError = action.type === 'error';
  return (
    <div
      className={`mt-2 flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
        isError
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      <span className="flex items-center gap-1.5">
        {ACTION_ICONS[action.type] ?? <SparkleIcon size={14} />}
        {action.summary}
      </span>
      {action.link && !isError && (
        <Link href={action.link} className="ml-2 shrink-0 text-emerald-600 hover:text-emerald-800">
          <ArrowRightIcon size={14} weight="bold" />
        </Link>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-stone-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build history (exclude welcome, last user msg)
    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      const data = (await res.json()) as {
        reply?: string;
        action?: Message['action'];
        error?: string;
      };

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply ?? data.error ?? 'No he podido procesar tu mensaje.',
        action: data.action,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: 'Ha ocurrido un error de conexión. Inténtalo de nuevo.',
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, loading, messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="mr-2 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100">
                <MicrophoneStageIcon size={14} weight="bold" className="text-brand-700" />
              </div>
            )}
            <div className="max-w-[80%]">
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-200 bg-white text-stone-800 shadow-sm'
                }`}
              >
                {msg.content}
              </div>
              {msg.action && <ActionCard action={msg.action} />}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="mr-2 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100">
              <MicrophoneStageIcon size={14} weight="bold" className="text-brand-700" />
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 bg-white/95 px-4 py-3 md:px-8">
        <div className="flex items-end gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Escribe lo que necesitas hacer…"
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm text-stone-900 placeholder:text-stone-400 outline-none disabled:opacity-50"
            style={{ overflowY: 'auto' }}
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow transition active:scale-95 disabled:opacity-40"
            aria-label="Enviar"
          >
            {loading ? <Spinner /> : <PaperPlaneTiltIcon size={15} weight="bold" />}
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] font-medium text-stone-400">
          Intro para enviar · Shift+Intro nueva línea
        </p>
      </div>
    </div>
  );
}
