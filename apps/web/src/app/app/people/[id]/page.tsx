import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import {
  ArrowLeftIcon,
  ChatCircleIcon,
  HeartIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession } from '@/lib/db';
import { Avatar, Button, EmptyState } from '@/components/ui';
import { roleLabel } from '@/lib/role-label';
import {
  acceptConnectionAction,
  connectAction,
} from '../../feed/actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [p] = await db
    .select({
      fullName: schema.profiles.fullName,
      email: schema.profiles.email,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, id))
    .limit(1);
  return { title: p?.fullName ?? p?.email ?? 'Persona' };
}

export default async function PersonProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await ensureSession();
  if (id === session.user.id) {
    // Su propio perfil: enviar al editor
    return (
      <div className="p-6 md:p-10">
        <p className="text-sm font-medium text-stone-600">
          Este es tu propio perfil.{' '}
          <Link
            href="/app/profile"
            className="font-bold text-brand-700 hover:text-brand-900"
          >
            Editar mi perfil
          </Link>
          .
        </p>
      </div>
    );
  }

  const [target] = await db
    .select({
      id: schema.profiles.id,
      fullName: schema.profiles.fullName,
      email: schema.profiles.email,
      avatarUrl: schema.profiles.avatarUrl,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, id))
    .limit(1);
  if (!target) notFound();

  // Clubes que comparten con el usuario actual
  const myClubIds = session.memberships.map((m) => m.clubId);
  const targetMemberships =
    myClubIds.length === 0
      ? []
      : await db
          .select({
            clubId: schema.clubMembers.clubId,
            role: schema.clubMembers.role,
            clubName: schema.clubs.name,
          })
          .from(schema.clubMembers)
          .innerJoin(
            schema.clubs,
            eq(schema.clubs.id, schema.clubMembers.clubId),
          )
          .where(
            and(
              eq(schema.clubMembers.profileId, id),
              inArray(schema.clubMembers.clubId, myClubIds),
            ),
          );

  if (targetMemberships.length === 0) {
    // No comparten club: no debería ser visible públicamente
    notFound();
  }

  // Estado de conexión
  const [conn] = await db
    .select({
      id: schema.connections.id,
      requesterId: schema.connections.requesterId,
      recipientId: schema.connections.recipientId,
      status: schema.connections.status,
    })
    .from(schema.connections)
    .where(
      or(
        and(
          eq(schema.connections.requesterId, session.user.id),
          eq(schema.connections.recipientId, id),
        ),
        and(
          eq(schema.connections.requesterId, id),
          eq(schema.connections.recipientId, session.user.id),
        ),
      ),
    )
    .limit(1);

  const isConnected = conn?.status === 'aceptada';
  const isPendingFromMe =
    conn?.status === 'pendiente' && conn.requesterId === session.user.id;
  const isPendingToMe =
    conn?.status === 'pendiente' && conn.recipientId === session.user.id;

  // Posts recientes (solo si están conectados)
  const posts = isConnected
    ? await db
        .select({
          id: schema.socialPosts.id,
          body: schema.socialPosts.body,
          photoUrl: schema.socialPosts.photoUrl,
          createdAt: schema.socialPosts.createdAt,
          likes: sql<number>`(
            select count(*)::int from social_likes l
            where l.post_id = ${schema.socialPosts.id}
          )`,
        })
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.authorId, id))
        .orderBy(desc(schema.socialPosts.createdAt))
        .limit(20)
    : [];

  // Conexiones aceptadas del target (recuento)
  const connectionCountRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.connections)
    .where(
      and(
        eq(schema.connections.status, 'aceptada'),
        or(
          eq(schema.connections.requesterId, id),
          eq(schema.connections.recipientId, id),
        ),
      ),
    );
  const connectionCount = connectionCountRows[0]?.c ?? 0;

  return (
    <div className="p-6 md:p-10">
      <Link
        href="/app/people"
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
      >
        <ArrowLeftIcon size={12} weight="bold" /> Personas
      </Link>

      <header className="flex flex-wrap items-start gap-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
        <Avatar
          name={target.fullName ?? target.email}
          src={target.avatarUrl}
          size="2xl"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
            {target.fullName ?? 'Sin nombre'}
          </h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {targetMemberships.map((m) => (
              <span
                key={m.clubId}
                className="inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-700"
              >
                {roleLabel(m.role)} · {m.clubName}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
            <span className="inline-flex items-center gap-1">
              <UsersThreeIcon size={12} weight="bold" /> {connectionCount}{' '}
              conexiones
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isConnected && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800">
              <UserCheckIcon size={12} weight="bold" /> Conectados
            </span>
          )}
          {isPendingFromMe && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600">
              Solicitud enviada
            </span>
          )}
          {isPendingToMe && conn && (
            <form action={acceptConnectionAction}>
              <input type="hidden" name="connectionId" value={conn.id} />
              <Button type="submit" size="sm">
                Aceptar solicitud
              </Button>
            </form>
          )}
          {!conn && (
            <form action={connectAction}>
              <input type="hidden" name="recipientId" value={target.id} />
              <Button type="submit" size="sm" variant="outline">
                <UserPlusIcon size={12} weight="bold" /> Conectar
              </Button>
            </form>
          )}
          <Link
            href={`/app/messages?to=${target.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700 hover:border-brand-300 hover:text-brand-700"
          >
            <ChatCircleIcon size={12} weight="bold" /> Mensaje
          </Link>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
          Publicaciones
        </h2>
        {!isConnected ? (
          <div className="mt-3 rounded-3xl border border-stone-200 bg-stone-50 p-6 text-center">
            <p className="text-sm font-medium text-stone-600">
              Conecta para ver lo que comparte.
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={<ChatCircleIcon size={36} weight="duotone" />}
              title="Aún no ha publicado nada"
              description="Cuando comparta algo, lo verás aquí."
            />
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {posts.map((p) => (
              <article
                key={p.id}
                className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card"
              >
                {p.photoUrl && (
                  <div className="relative aspect-video bg-stone-100">
                    <img
                      src={p.photoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="px-4 py-3 text-sm font-medium text-stone-800">
                  {p.body}
                </div>
                <footer className="flex items-center gap-3 border-t border-stone-100 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
                  <span className="inline-flex items-center gap-1.5">
                    <HeartIcon size={12} weight="bold" /> {p.likes}
                  </span>
                  <span className="ml-auto">
                    {new Date(p.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
