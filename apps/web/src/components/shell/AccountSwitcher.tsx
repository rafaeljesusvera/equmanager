'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CaretDownIcon,
  CheckCircleIcon,
  UserCircleIcon,
  HorseIcon,
} from '@phosphor-icons/react/dist/ssr';
import { switchAccount } from '@/app/app/account-switch.action';

type SelfAccount = {
  kind: 'self';
  linkId: null;
  name: string;
  email: string;
  avatarUrl: string | null;
  contextLine: string;
  relationLabel: string;
};

type LinkedProfileAccount = {
  kind: 'linked-profile';
  linkId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  contextLine: string;
  relationLabel: string;
};

type LinkedRiderAccount = {
  kind: 'linked-rider';
  linkId: string;
  name: string;
  photoUrl: string | null;
  contextLine: string;
  relationLabel: string;
};

export type SwitcherAccount =
  | SelfAccount
  | LinkedProfileAccount
  | LinkedRiderAccount;

export function AccountSwitcher({
  active,
  accounts,
}: {
  active: SwitcherAccount;
  accounts: SwitcherAccount[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function choose(linkId: string | null) {
    startTransition(async () => {
      try {
        await switchAccount(linkId);
        setOpen(false);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (accounts.length <= 1) {
    return <AccountChip account={active} />;
  }

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-2.5 py-1.5 transition hover:border-brand-300 hover:shadow-card"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar account={active} size={28} />
        <div className="hidden min-w-0 text-left md:block">
          <div className="truncate text-xs font-bold text-stone-900">
            {active.name}
          </div>
          <div className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
            {active.relationLabel}
          </div>
        </div>
        <CaretDownIcon
          size={12}
          weight="bold"
          className="text-stone-400 transition group-hover:text-brand-700"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lift"
        >
          <div className="border-b border-stone-100 bg-stone-50/60 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Cuenta activa
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Avatar account={active} size={40} />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-stone-900">
                  {active.name}
                </div>
                <div className="truncate text-[11px] font-medium text-stone-500">
                  {active.contextLine}
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto py-2">
            <div className="px-4 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
              Cambiar a
            </div>
            {accounts.map((acc) => {
              const isActive = acc.linkId === active.linkId;
              return (
                <button
                  key={acc.linkId ?? 'self'}
                  type="button"
                  role="menuitem"
                  disabled={isPending || isActive}
                  onClick={() => choose(acc.linkId)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                    isActive
                      ? 'bg-brand-50/70'
                      : 'hover:bg-stone-50 disabled:opacity-50'
                  }`}
                >
                  <Avatar account={acc} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-bold text-stone-900">
                        {acc.name}
                      </div>
                      <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-stone-600">
                        {acc.relationLabel}
                      </span>
                    </div>
                    <div className="truncate text-[11px] font-medium text-stone-500">
                      {acc.contextLine}
                    </div>
                  </div>
                  {isActive && (
                    <CheckCircleIcon
                      size={18}
                      weight="fill"
                      className="shrink-0 text-brand-700"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountChip({ account }: { account: SwitcherAccount }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-2.5 py-1.5">
      <Avatar account={account} size={28} />
      <div className="hidden min-w-0 text-left md:block">
        <div className="truncate text-xs font-bold text-stone-900">
          {account.name}
        </div>
        <div className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
          {account.relationLabel}
        </div>
      </div>
    </div>
  );
}

function Avatar({
  account,
  size,
}: {
  account: SwitcherAccount;
  size: number;
}) {
  const wrap = `flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200`;
  const dim = { width: size, height: size };
  if (account.kind === 'linked-rider') {
    if (account.photoUrl) {
      return (
        <span className={wrap} style={dim}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={account.photoUrl}
            alt={account.name}
            width={size}
            height={size}
            className="h-full w-full object-cover"
          />
        </span>
      );
    }
    return (
      <span
        className={`${wrap} bg-amber-100 text-amber-700`}
        style={dim}
      >
        <HorseIcon size={Math.round(size * 0.55)} weight="duotone" />
      </span>
    );
  }
  if (account.avatarUrl) {
    return (
      <span className={wrap} style={dim}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={account.avatarUrl}
          alt={account.name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={`${wrap} bg-brand-100 text-brand-700`}
      style={dim}
    >
      <UserCircleIcon size={Math.round(size * 0.7)} weight="duotone" />
    </span>
  );
}

