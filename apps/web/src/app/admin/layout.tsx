import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BuildingsIcon,
  HorseIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ChartLineIcon,
  ArrowLeftIcon,
} from '@phosphor-icons/react/dist/ssr';
import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@equmanager/auth';
import { LogoMark } from '@/components/brand/Logo';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect('/login');
  const [profile] = await db
    .select({ isSuperadmin: schema.profiles.isSuperadmin })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, user.id))
    .limit(1)
    .catch(() => [{ isSuperadmin: false }]);
  if (!profile?.isSuperadmin) redirect('/app');

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-stone-200 bg-white md:flex">
        <div className="p-5">
          <div className="flex items-center gap-2">
            <LogoMark size={32} />
            <div>
              <div className="text-sm font-bold text-stone-900">Equmanager</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                Superadmin
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 pb-6">
          <AdminLink href="/admin" icon={<ChartBarIcon size={18} weight="duotone" />}>
            Resumen
          </AdminLink>
          <AdminLink href="/admin/clubs" icon={<BuildingsIcon size={18} weight="duotone" />}>
            Clubes
          </AdminLink>
          <AdminLink href="/admin/horses" icon={<HorseIcon size={18} weight="duotone" />}>
            Caballos
          </AdminLink>
          <AdminLink href="/admin/users" icon={<UsersIcon size={18} weight="duotone" />}>
            Usuarios
          </AdminLink>
          <AdminLink href="/admin/directory" icon={<MagnifyingGlassIcon size={18} weight="duotone" />}>
            Directorio público
          </AdminLink>
          <AdminLink href="/admin/stats" icon={<ChartLineIcon size={18} weight="duotone" />}>
            Estadísticas
          </AdminLink>
        </nav>
        <div className="border-t border-stone-200 p-4">
          <Link
            href="/app"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-500 transition hover:bg-stone-100 hover:text-brand-700"
          >
            <ArrowLeftIcon size={12} weight="bold" /> Volver a la app
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <AdminMobileNav />
          <div className="flex items-center gap-2">
            <LogoMark size={24} />
            <div>
              <div className="text-xs font-bold leading-tight text-stone-900">
                Equmanager
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-700">
                Superadmin
              </div>
            </div>
          </div>
          <Link
            href="/app"
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
          >
            Volver
          </Link>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function AdminLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-100 hover:text-brand-700"
    >
      <span className="text-stone-400 transition group-hover:text-brand-600">
        {icon}
      </span>
      {children}
    </Link>
  );
}
