import { db, schema } from '@equmanager/database';
import { eq, sql } from 'drizzle-orm';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge } from '@/components/ui';
import { Paginator } from '@/components/admin/Paginator';

export const metadata = { title: 'Superadmin · Clubes' };
export const dynamic = 'force-dynamic';

const PER_ALLOWED = [20, 50, 100] as const;
type Per = (typeof PER_ALLOWED)[number];

const FEDERATION_LABEL: Record<string, string> = {
  rfhe: 'RFHE',
  andalucia: 'Andalucía',
  aragon: 'Aragón',
  asturias: 'Asturias',
  baleares: 'Baleares',
  canarias: 'Canarias',
  cantabria: 'Cantabria',
  castilla_leon: 'Castilla y León',
  castilla_la_mancha: 'Castilla-La Mancha',
  cataluna: 'Cataluña',
  ceuta: 'Ceuta',
  extremadura: 'Extremadura',
  galicia: 'Galicia',
  madrid: 'Madrid',
  melilla: 'Melilla',
  murcia: 'Murcia',
  navarra: 'Navarra',
  pais_vasco: 'País Vasco',
  la_rioja: 'La Rioja',
  valencia: 'Valencia',
};

export default async function AdminClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const per: Per = (PER_ALLOWED.includes(Number(sp.per) as Per) ? Number(sp.per) : 20) as Per;
  const offset = (page - 1) * per;

  const [clubs, countRow] = await Promise.all([
    db
      .select({
        id: schema.clubs.id,
        name: schema.clubs.name,
        slug: schema.clubs.slug,
        plan: schema.clubs.plan,
        createdAt: schema.clubs.createdAt,
        directoryFederation: schema.directoryClubs.federation,
        directoryName: schema.directoryClubs.name,
        members: sql<number>`(
          select count(*)::int from club_members cm
          where cm.club_id = ${schema.clubs.id}
        )`,
        horses: sql<number>`(
          select count(*)::int from horses h
          where h.club_id = ${schema.clubs.id}
        )`,
        riders: sql<number>`(
          select count(*)::int from riders r
          where r.club_id = ${schema.clubs.id}
        )`,
      })
      .from(schema.clubs)
      .leftJoin(
        schema.directoryClubs,
        eq(schema.directoryClubs.id, schema.clubs.directoryClubId),
      )
      .orderBy(schema.clubs.name)
      .limit(per)
      .offset(offset),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.clubs)
      .then((r) => r[0]?.n ?? 0),
  ]);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Clubes operativos"
        description="Cada fila es un club que está usando Equmanager. Para entrar en uno, usa el switcher como propietario."
      />

      <div className="mt-6 overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            <tr>
              <th className="px-4 py-3 text-left">Club</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Federación</th>
              <th className="px-4 py-3 text-right">Miembros</th>
              <th className="px-4 py-3 text-right">Caballos</th>
              <th className="px-4 py-3 text-right">Jinetes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {clubs.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-bold text-stone-900">{c.name}</td>
                <td className="px-4 py-3 text-stone-600">{c.slug}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.plan === 'enterprise' ? 'brand' : 'neutral'}>
                    {c.plan}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {c.directoryFederation ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800"
                      title={c.directoryName ?? ''}
                    >
                      {FEDERATION_LABEL[c.directoryFederation] ??
                        c.directoryFederation}
                    </span>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{c.members}</td>
                <td className="px-4 py-3 text-right">{c.horses}</td>
                <td className="px-4 py-3 text-right">{c.riders}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Paginator total={countRow} page={page} per={per} basePath="/admin/clubs" />
      </div>
    </div>
  );
}
