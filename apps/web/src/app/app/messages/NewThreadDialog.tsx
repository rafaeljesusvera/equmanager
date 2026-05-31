'use client';

import { useState } from 'react';
import { PlusIcon, XIcon, MegaphoneIcon } from '@phosphor-icons/react/dist/ssr';
import { Avatar, Button, Input, Textarea, SubmitButton } from '@/components/ui';
import { roleLabel } from '@/lib/role-label';
import type { ClubRole } from '@equmanager/domain';
import { createBroadcastAction, startDirectThreadAction } from './actions';

type Peer = {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  clubName: string;
  role: ClubRole;
};

type BroadcastAudience = 'riders' | 'horse_owners' | 'all';

type BroadcastOption = {
  value: BroadcastAudience;
  label: string;
  hint: string;
};

type Props = {
  peers: Peer[];
  broadcastOptions: BroadcastOption[];
  primaryClubName: string | null;
};

type Mode = 'direct' | 'broadcast';

export function NewThreadDialog({
  peers,
  broadcastOptions,
  primaryClubName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('direct');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState<BroadcastAudience | null>(
    broadcastOptions[0]?.value ?? null,
  );

  const canBroadcast = broadcastOptions.length > 0;

  const filtered = peers
    .filter((p) => {
      if (!q.trim()) return true;
      const hay = `${p.fullName ?? ''} ${p.email}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .slice(0, 40);

  const selected = peers.find((p) => p.id === selectedId);
  const selectedAudience = broadcastOptions.find((o) => o.value === audience);

  function reset() {
    setOpen(false);
    setMode('direct');
    setQ('');
    setSelectedId(null);
    setBody('');
    setTitle('');
    setAudience(broadcastOptions[0]?.value ?? null);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        <PlusIcon size={14} weight="bold" /> Nuevo mensaje
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="text-base font-bold text-stone-900">
                {mode === 'broadcast' ? 'Nuevo anuncio' : 'Nuevo mensaje'}
              </h2>
              <button
                type="button"
                onClick={reset}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
              >
                <XIcon size={14} weight="bold" />
              </button>
            </div>

            {canBroadcast && (
              <div className="border-b border-stone-200 bg-stone-50 px-5 py-3">
                <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setMode('direct')}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition ${
                      mode === 'direct'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Directo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('broadcast')}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition ${
                      mode === 'broadcast'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <MegaphoneIcon size={12} weight="bold" /> Anuncio
                  </button>
                </div>
              </div>
            )}

            {mode === 'direct' && !selected && (
              <div className="p-5">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Busca a alguien de tu(s) centro(s)…"
                  autoFocus
                />
                <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-stone-200">
                  {filtered.length === 0 ? (
                    <p className="px-3 py-5 text-center text-xs font-medium text-stone-500">
                      Sin resultados.
                    </p>
                  ) : (
                    filtered.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        className="flex w-full items-center gap-3 border-b border-stone-100 px-3 py-2 text-left last:border-b-0 hover:bg-stone-50"
                      >
                        <Avatar
                          name={p.fullName ?? p.email}
                          src={p.avatarUrl}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-stone-900">
                            {p.fullName ?? p.email}
                          </div>
                          <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                            {roleLabel(p.role)} · {p.clubName}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {mode === 'direct' && selected && (
              <form
                action={async (fd: FormData) => {
                  fd.set('recipientId', selected.id);
                  fd.set('body', body);
                  await startDirectThreadAction(fd);
                  reset();
                }}
                className="p-5"
              >
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <Avatar
                    name={selected.fullName ?? selected.email}
                    src={selected.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-stone-900">
                      {selected.fullName ?? selected.email}
                    </div>
                    <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      {roleLabel(selected.role)} · {selected.clubName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="ml-auto rounded-lg border border-stone-300 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:border-red-300 hover:text-red-700"
                  >
                    Cambiar
                  </button>
                </div>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Escribe tu mensaje…"
                  required
                />
                <div className="mt-3 flex justify-end">
                  <SubmitButton disabled={!body.trim()}>
                    Enviar
                  </SubmitButton>
                </div>
              </form>
            )}

            {mode === 'broadcast' && audience && (
              <form
                action={async (fd: FormData) => {
                  fd.set('audience', audience);
                  fd.set('title', title);
                  fd.set('body', body);
                  await createBroadcastAction(fd);
                  reset();
                }}
                className="p-5"
              >
                <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-800">
                    Anuncio en {primaryClubName ?? 'tu centro'}
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber-900">
                    Lo recibirán todos los destinatarios del grupo seleccionado.
                  </p>
                </div>

                <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600">
                  Destinatarios
                </label>
                <div className="mt-2 grid gap-2">
                  {broadcastOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAudience(opt.value)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        audience === opt.value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="text-sm font-bold text-stone-900">
                        {opt.label}
                      </div>
                      <div className="mt-0.5 text-xs font-medium text-stone-600">
                        {opt.hint}
                      </div>
                    </button>
                  ))}
                </div>

                <label className="mt-4 block text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600">
                  Título (opcional)
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Anuncio · ${selectedAudience?.label ?? ''}`}
                  className="mt-2"
                />

                <label className="mt-4 block text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600">
                  Mensaje
                </label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Escribe el anuncio…"
                  required
                  className="mt-2"
                />

                <div className="mt-3 flex justify-end">
                  <SubmitButton disabled={!body.trim()}>
                    Enviar anuncio
                  </SubmitButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
