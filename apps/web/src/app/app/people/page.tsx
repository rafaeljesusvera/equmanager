import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, eq, inArray, ne, or, sql } from 'drizzle-orm';
import {
  MagnifyingGlassIcon,
  UsersThreeIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import type { ClubRole } from '@equmanager/domain';
import { ensureSession } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Avatar, EmptyState, Input } from '@/components/ui';
import { roleLabel } from '@/lib/role-label';

export const metadata = { title: 'Personas' };
export const dynamic = 'force-dynamic';

const ROLE_FILTERS: Array<{ value: ClubRole | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'rider', label: 'Alumnos' },
  { value: 'instructor', label: 'Monitores' },
  { value: 'horse_owner', label: 'Propietarios' },
  { value: 'groom', label: 'Mozos' },
  { value: 'provider', label: 'Proveedores' },
];

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const session = await ensureSession();
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const roleFilter = (params.role ?? '').trim() as ClubRole | '';

  const myClubIds = session.memberships.map((m) => m.clubId);
  if (myClubIds.length === 0) {
    return (
      <div className="p-6 md:p-10">
        <PageHeader
          eyebrow="Comunidad"
          title="Personas"
          description="Conoce al resto de personas vinculadas a tu centro."
        />
        <div className="mt-6">
          <EmptyState
            icon={<UsersThreeIcon size={36} weight="duotone" />}
            title="Aún no estás en ningún centro"
            description="Únete a un club para empezar a conectar con otros usuarios."
          />
        </div>
      </div>
    );
  }

  const peers = await db
    .select({
      id: schema.profiles.id,
      fullName: schema.profiles.fullName,
      avatarUrl: schema.profiles.avatarUrl,
      role: schema.clubMembers.role,
      clubName: schema.clubs.name,
    })
    .from(schema.clubMembers)
    .innerJoin(
      schema.profiles,
      eq(schema.profiles.id, schema.clubMembers.profileId),
    )
    .innerJoin(
      schema.clubs,
      eq(schema.clubs.id, schema.clubMembers.clubId),
    )
    .where(
      and(
        inArray(schema.clubMembers.clubId, myClubIds),
        ne(schema.clubMembers.profileId, session.user.id),
        roleFilter
          ? eq(schema.clubMembers.role, roleFilter)
          : sql`true`,
        q
          ? sql`(${schema.profiles.fullName} ilike ${'%' + q + '%'}
                 or ${schema.profiles.email} ilike ${'%' + q + '%'})`
          : sql`true`,
      ),
    )
    .limit(80);

  // Deduplicar por profile id, conservando el primer rol/club que encontramos
  const unique = Array.from(new Map(peers.map((p) => [p.id, p])).values());

  // Conexiones del usuario actual (cualquier estado) para pintar estado por tarjeta
  const conns = await db
    .select({
      requester: schema.connections.requesterId,
      recipient: schema.connections.recipientId,
      status: schema.connections.status,
    })
    .from(schema.connections)
    .where(
      or(
        eq(schema.connections.requesterId, session.user.id),
        eq(schema.connections.recipientId, session.user.id),
      ),
    );
  const stateById = new Map<string, 'connected' | 'pending' | 'incoming'>();
  for (const c of conns) {
    const other = c.requester === session.user.id ? c.recipient : c.requester;
    if (c.status === 'aceptada') stateById.set(other, 'connected');
    else if (c.status === 'pendiente') {
      stateById.set(
        other,
        c.requester === session.user.id ? 'pending' : 'incoming',
      );
    }
  }

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Comunidad"
        title="Personas"
        description="Encuentra a alumnos, monitores y propietarios de tus centros y conecta con ellos."
      />

      <form className="mt-6 flex flex-wrap items-end gap-3" action="">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600">
            Buscar
          </label>
          <div className="relative mt-2">
            <MagnifyingGlassIcon
              size={14}
              weight="bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Nombre o email…"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600">
            Filtrar
          </label>
          <select
            name="role"
            defaultValue={roleFilter}
            className="mt-2 h-10 rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-800 focus:border-brand-500 focus:outline-none"
          >
            {ROLE_FILTERS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-10 rounded-xl bg-stone-900 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:bg-stone-800"
        >
          Buscar
        </button>
      </form>

      <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
        {unique.length} {unique.length === 1 ? 'persona' : 'personas'}
      </div>

      {unique.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<UsersThreeIcon size={36} weight="duotone" />}
            title="Sin resultados"
            description="Prueba a quitar filtros o cambiar la búsqueda."
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          {unique.map((p) => {
            const state = stateById.get(p.id);
            return (
              <Link
                key={p.id}
                href={`/app/people/${p.id}`}
                className="group flex items-center gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-card transition hover:border-brand-300"
              >
                <Avatar
                  name={p.fullName ?? '—'}
                  src={p.avatarUrl}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-stone-900">
                    {p.fullName ?? 'Sin nombre'}
                  </div>
                  <div className="truncate text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {roleLabel(p.role)} · {p.clubName}
                  </div>
                  {state && (
                    <div className="mt-1 inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-700">
                      {state === 'connected'
                        ? 'Conectado'
                        : state === 'pending'
                          ? 'Solicitud enviada'
                          : 'Te ha pedido conectar'}
                    </div>
                  )}
                </div>
                <ArrowRightIcon
                  size={16}
                  className="text-stone-300 group-hover:text-brand-600"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
