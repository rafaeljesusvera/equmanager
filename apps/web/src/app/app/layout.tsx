import { getCurrentUser } from '@equmanager/auth';
import { Home, Users, Sparkles, LogOut, type LucideIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signOut } from '../auth/actions';

const nav: { href: Route; label: string; icon: LucideIcon }[] = [
  { href: '/app', label: 'Inicio', icon: Home },
  { href: '/app/horses', label: 'Caballos', icon: Sparkles },
  { href: '/app/riders', label: 'Jinetes', icon: Users },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="hidden w-60 flex-col border-r border-stone-200 bg-white p-4 md:flex">
        <div className="mb-6 px-2">
          <div className="text-2xl">🏇</div>
          <div className="mt-1 text-sm font-black text-stone-900">
            Equmanager
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
            Panel
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-stone-200 pt-4">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Sesión
          </div>
          <div className="px-3 pb-2 text-xs font-bold text-stone-700">
            {user.email}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <LogOut size={14} /> Salir
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
