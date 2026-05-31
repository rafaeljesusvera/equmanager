import { db, schema } from '@equmanager/database';
import { eq, sql } from 'drizzle-orm';
import { PageHeader } from '@/components/page/PageHeader';
import {
  DirectoryExplorer,
  type DirectoryRow,
} from './DirectoryExplorer';
import { Paginator } from '@/components/admin/Paginator';

export const metadata = { title: 'Superadmin · Directorio' };
export const dynamic = 'force-dynamic';

const PER_ALLOWED = [20, 50, 100] as const;
type Per = (typeof PER_ALLOWED)[number];

export default async function AdminDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const per: Per = (PER_ALLOWED.includes(Number(sp.per) as Per) ? Number(sp.per) : 20) as Per;
  const offset = (page - 1) * per;

  const [data, total] = await Promise.all([
    db
      .select({
        id: schema.directoryClubs.id,
        name: schema.directoryClubs.name,
        federation: schema.directoryClubs.federation,
        province: schema.directoryClubs.province,
        city: schema.directoryClubs.city,
        website: schema.directoryClubs.website,
        claimedClubName: schema.clubs.name,
      })
      .from(schema.directoryClubs)
      .leftJoin(
        schema.clubs,
        eq(schema.clubs.directoryClubId, schema.directoryClubs.id),
      )
      .orderBy(schema.directoryClubs.name)
      .limit(per)
      .offset(offset),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.directoryClubs)
      .then((r) => r[0]?.n ?? 0),
  ]);

  const rows: DirectoryRow[] = data.map((r) => ({
    id: r.id,
    name: r.name,
    federation: r.federation,
    province: r.province,
    city: r.city,
    website: r.website,
    claimedClubName: r.claimedClubName,
  }));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Directorio público de clubes"
        description={`Datos cargados vía ingesta oficial. ${total.toLocaleString('es-ES')} clubes en directorio.`}
      />

      {total === 0 ? (
        <div className="mt-6 rounded-3xl border border-stone-200 bg-white px-4 py-10 text-center text-sm font-medium text-stone-500 shadow-card">
          Aún no hay datos. Ejecuta{' '}
          <code className="rounded bg-stone-100 px-1.5 py-0.5">
            pnpm db:directory-ingest -- ./data/clubs.json
          </code>{' '}
          con el dataset oficial.
        </div>
      ) : (
        <>
          <DirectoryExplorer rows={rows} />
          <div className="mt-4 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
            <Paginator
              total={total}
              page={page}
              per={per}
              basePath="/admin/directory"
            />
          </div>
        </>
      )}
    </div>
  );
}
