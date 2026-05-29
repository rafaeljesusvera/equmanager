import { redirect } from 'next/navigation';
import { getCurrentUser } from '@equmanager/auth';
import type { ClubRole } from '@equmanager/domain';
import { loadSession, type CurrentSession } from './profile';

export type EnsuredSession = CurrentSession & {
  primary: NonNullable<CurrentSession['primary']>;
};

/**
 * Garantiza sesión + membership. Si el usuario no tiene club aún, redirige
 * a `/onboarding`. Si no hay sesión, redirige a `/login`.
 */
export async function ensureSession(): Promise<EnsuredSession> {
  const user = await getCurrentUser();
  if (!user || !user.email) redirect('/login');

  const session = await loadSession({
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata as Record<string, unknown>,
  });

  if (!session.primary) {
    redirect('/onboarding');
  }

  return session as EnsuredSession;
}

/**
 * Sesión sin necesidad de membership (para onboarding o /app raíz).
 */
export async function getSessionOrRedirect(): Promise<CurrentSession> {
  const user = await getCurrentUser();
  if (!user || !user.email) redirect('/login');

  return loadSession({
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata as Record<string, unknown>,
  });
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

export function roleLabel(role: ClubRole): string {
  return {
    owner: 'Propietario hípica',
    admin: 'Administrador',
    instructor: 'Instructor',
    groom: 'Mozo',
    horse_owner: 'Propietario caballo',
    rider: 'Alumno',
  }[role];
}
