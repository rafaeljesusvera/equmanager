import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@equmanager/auth';
import type { ClubRole } from '@equmanager/domain';
import { loadSession, type CurrentSession } from './profile';

export type EnsuredSession = CurrentSession & {
  primary: NonNullable<CurrentSession['primary']>;
};

// React.cache() deduplica llamadas idénticas dentro del mismo render tree.
// Así layout y page pueden llamar ensureSession() de forma independiente
// pero solo ejecutan las queries una vez por request.
const getCachedUser = cache(getCurrentUser);
const getCachedSession = cache(
  (id: string, email: string, meta: Record<string, unknown> | null) =>
    loadSession({ id, email, user_metadata: meta }),
);

/**
 * Garantiza sesión + membership. Si el usuario no tiene club aún, redirige
 * a `/onboarding`. Si no hay sesión, redirige a `/login`.
 */
export async function ensureSession(): Promise<EnsuredSession> {
  const user = await getCachedUser();
  if (!user || !user.email) redirect('/login');

  const session = await getCachedSession(
    user.id,
    user.email,
    (user.user_metadata as Record<string, unknown>) ?? null,
  );

  if (!session.primary) {
    redirect('/onboarding');
  }

  return session as EnsuredSession;
}

/**
 * Sesión sin necesidad de membership (para onboarding o /app raíz).
 */
export async function getSessionOrRedirect(): Promise<CurrentSession> {
  const user = await getCachedUser();
  if (!user || !user.email) redirect('/login');

  return getCachedSession(
    user.id,
    user.email,
    (user.user_metadata as Record<string, unknown>) ?? null,
  );
}

/**
 * Permite a un usuario con varios roles ver una página solo si tiene uno
 * de los roles requeridos.
 */
export function assertRole(
  session: EnsuredSession,
  allowed: readonly ClubRole[],
) {
  const has = session.memberships.some((m) =>
    allowed.includes(m.role as ClubRole),
  );
  if (!has) redirect('/app');
}

export { roleLabel } from '@/lib/role-label';
