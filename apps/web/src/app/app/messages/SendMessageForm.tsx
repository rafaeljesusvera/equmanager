'use client';

import { useFormStatus } from 'react-dom';
import { useRef, useEffect } from 'react';
import { sendMessageAction } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-brand-800 disabled:opacity-60"
    >
      {pending ? (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      ) : (
        'Enviar'
      )}
    </button>
  );
}

export function SendMessageForm({ threadId }: { threadId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Limpiar el textarea tras enviar (el server action recarga la página,
  // pero si hay optimistic updates futuros, ya está listo)
  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    function onSubmit() {
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.value = '';
      }, 100);
    }
    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  }, []);

  return (
    <form
      ref={ref}
      action={sendMessageAction}
      className="mt-3 flex items-end gap-2 rounded-3xl border border-stone-200 bg-white p-3 shadow-card"
    >
      <input type="hidden" name="threadId" value={threadId} />
      <textarea
        ref={textareaRef}
        name="body"
        rows={2}
        placeholder="Escribe un mensaje…"
        required
        className="flex-1 resize-none rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
      />
      <SubmitButton />
    </form>
  );
}
