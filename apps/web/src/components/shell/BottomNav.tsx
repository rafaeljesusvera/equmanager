'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  HouseIcon,
  HorseIcon,
  CalendarBlankIcon,
  ChatCircleIcon,
  ClipboardTextIcon,
  ListIcon,
  XIcon,
  CalendarPlusIcon,
  SignOutIcon,
  ShieldStarIcon,
  ArrowRightIcon,
  SparkleIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react/dist/ssr';
import { NavIcon } from './NavIcon';
import { LogoMark } from '@/components/brand/Logo';
import { signOut } from '@/app/auth/actions';
import type { NavSection } from '@/lib/nav';
import type { ClubRole } from '@equmanager/domain';

// ─── config por rol ───────────────────────────────────────────────────────────

type TabItem = { href: string; label: string; icon: React.ReactNode };
type FabItem = { href: string; icon: React.ReactNode };
type NavConfig = { tabs: [TabItem, TabItem, TabItem, TabItem]; fab: FabItem };

function getConfig(roles: ClubRole[]): NavConfig {
  const has = (r: ClubRole) => roles.includes(r);

  if (has('owner') || has('admin')) {
    return {
      tabs: [
        { href: '/app', label: 'Inicio', icon: <HouseIcon size={22} weight="duotone" /> },
        { href: '/app/horses', label: 'Caballos', icon: <HorseIcon size={22} weight="duotone" /> },
        { href: '/app/messages', label: 'Mensajes', icon: <ChatCircleIcon size={22} weight="duotone" /> },
        { href: '/app/feed', label: 'Feed', icon: <SparkleIcon size={22} weight="duotone" /> },
      ],
      fab: { href: '/app/lessons', icon: <CalendarPlusIcon size={26} weight="bold" /> },
    };
  }

  if (has('instructor')) {
    return {
      tabs: [
        { href: '/app', label: 'Inicio', icon: <HouseIcon size={22} weight="duotone" /> },
        { href: '/app/lessons', label: 'Clases', icon: <CalendarBlankIcon size={22} weight="duotone" /> },
        { href: '/app/messages', label: 'Mensajes', icon: <ChatCircleIcon size={22} weight="duotone" /> },
        { href: '/app/feed', label: 'Feed', icon: <SparkleIcon size={22} weight="duotone" /> },
      ],
      fab: { href: '/app/lessons', icon: <CalendarPlusIcon size={26} weight="bold" /> },
    };
  }

  if (has('rider')) {
    return {
      tabs: [
        { href: '/app', label: 'Inicio', icon: <HouseIcon size={22} weight="duotone" /> },
        { href: '/app/me/lessons', label: 'Clases', icon: <CalendarBlankIcon size={22} weight="duotone" /> },
        { href: '/app/messages', label: 'Mensajes', icon: <ChatCircleIcon size={22} weight="duotone" /> },
        { href: '/app/people', label: 'Personas', icon: <UsersThreeIcon size={22} weight="duotone" /> },
      ],
      fab: { href: '/app/me/horses', icon: <HorseIcon size={26} weight="bold" /> },
    };
  }

  if (has('groom')) {
    return {
      tabs: [
        { href: '/app', label: 'Inicio', icon: <HouseIcon size={22} weight="duotone" /> },
        { href: '/app/feed', label: 'Feed', icon: <SparkleIcon size={22} weight="duotone" /> },
        { href: '/app/messages', label: 'Mensajes', icon: <ChatCircleIcon size={22} weight="duotone" /> },
        { href: '/app/people', label: 'Personas', icon: <UsersThreeIcon size={22} weight="duotone" /> },
      ],
      fab: { href: '/app/groom', icon: <ClipboardTextIcon size={26} weight="bold" /> },
    };
  }

  if (has('horse_owner')) {
    return {
      tabs: [
        { href: '/app', label: 'Inicio', icon: <HouseIcon size={22} weight="duotone" /> },
        { href: '/app/horse-owner', label: 'Mis caballos', icon: <HorseIcon size={22} weight="duotone" /> },
        { href: '/app/messages', label: 'Mensajes', icon: <ChatCircleIcon size={22} weight="duotone" /> },
        { href: '/app/feed', label: 'Feed', icon: <SparkleIcon size={22} weight="duotone" /> },
      ],
      fab: { href: '/app/horse-owner', icon: <ClipboardTextIcon size={26} weight="bold" /> },
    };
  }

  // provider / fallback
  return {
    tabs: [
      { href: '/app', label: 'Inicio', icon: <HouseIcon size={22} weight="duotone" /> },
      { href: '/app/provider', label: 'Agenda', icon: <CalendarBlankIcon size={22} weight="duotone" /> },
      { href: '/app/messages', label: 'Mensajes', icon: <ChatCircleIcon size={22} weight="duotone" /> },
      { href: '/app/feed', label: 'Feed', icon: <SparkleIcon size={22} weight="duotone" /> },
    ],
    fab: { href: '/app/provider', icon: <CalendarPlusIcon size={26} weight="bold" /> },
  };
}

// ─── componente ───────────────────────────────────────────────────────────────

export function BottomNav({
  roles,
  sections,
  clubName,
  roleLabel,
  email,
  isSuperadmin = false,
}: {
  roles: ClubRole[];
  sections: NavSection[];
  clubName: string;
  roleLabel: string;
  email: string;
  isSuperadmin?: boolean;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const config = getConfig(roles);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname.startsWith(href);

  // split tabs: 2 left, 2 right (FAB in the middle)
  const [l1, l2, r1, r2] = config.tabs;

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 flex items-end justify-around border-t border-stone-200 bg-white/95 pb-safe backdrop-blur md:hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        {/* left tabs */}
        <TabBtn item={l1} active={isActive(l1.href)} />
        <TabBtn item={l2} active={isActive(l2.href)} />

        {/* FAB central */}
        <div className="relative -top-4 flex flex-col items-center">
          <Link
            href={config.fab.href}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg shadow-brand-700/40 transition active:scale-95"
            aria-label="Acción principal"
          >
            {config.fab.icon}
          </Link>
        </div>

        {/* right tabs */}
        <TabBtn item={r1} active={isActive(r1.href)} />

        {/* Más */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-2 text-stone-400"
          aria-label="Más opciones"
        >
          <ListIcon size={22} weight="duotone" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Más</span>
        </button>
      </nav>

      {/* Drawer "Más" */}
      {mounted && drawerOpen
        ? createPortal(
            <div className="fixed inset-0 z-[80] md:hidden" role="dialog" aria-modal="true">
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setDrawerOpen(false)}
                className="absolute inset-0 bg-stone-900/55"
              />
              <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-stone-200 p-4">
                  <div className="flex items-center gap-2">
                    <LogoMark size={28} />
                    <div className="text-sm font-bold text-stone-900">Equmanager</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
                    aria-label="Cerrar"
                  >
                    <XIcon size={18} weight="bold" />
                  </button>
                </div>

                <div className="px-4 py-3">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Club activo</div>
                    <div className="text-sm font-bold text-stone-900">{clubName}</div>
                    <div className="mt-1 inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-800">
                      {roleLabel}
                    </div>
                  </div>

                  {isSuperadmin && (
                    <Link
                      href="/admin"
                      onClick={() => setDrawerOpen(false)}
                      className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <ShieldStarIcon size={18} weight="fill" className="shrink-0 text-amber-700" />
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Superadmin</div>
                          <div className="truncate text-xs font-bold text-stone-900">Panel del sistema</div>
                        </div>
                      </div>
                      <ArrowRightIcon size={12} weight="bold" className="shrink-0 text-amber-700" />
                    </Link>
                  )}
                </div>

                <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4" onClick={() => setDrawerOpen(false)}>
                  {sections.map((section) => (
                    <div key={section.title}>
                      <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                        {section.title}
                      </div>
                      <div className="space-y-0.5">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-700 active:bg-stone-100"
                          >
                            <span className="text-stone-400">
                              <NavIcon name={item.icon} weight="duotone" />
                            </span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>

                <div className="border-t border-stone-200 p-4">
                  <div className="truncate pb-2 text-xs font-medium text-stone-600">{email}</div>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-red-700"
                    >
                      <SignOutIcon size={14} weight="bold" /> Cerrar sesión
                    </button>
                  </form>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function TabBtn({ item, active }: { item: TabItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex flex-col items-center gap-0.5 px-3 py-2 transition ${
        active ? 'text-brand-700' : 'text-stone-400'
      }`}
    >
      {item.icon}
      <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{item.label}</span>
    </Link>
  );
}
