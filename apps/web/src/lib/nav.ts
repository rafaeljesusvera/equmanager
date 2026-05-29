import type { ClubRole } from '@equmanager/domain';

export type NavSection = {
  title: string;
  items: NavItem[];
};

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: ClubRole[];
};

/**
 * Devuelve las secciones de navegación que aplican a este conjunto de roles.
 * Un usuario puede tener varios roles activos en distintos clubes.
 */
export function buildNav(roles: ClubRole[]): NavSection[] {
  const hasAny = (r: ClubRole[]) => r.some((x) => roles.includes(x));

  const sections: NavSection[] = [];

  sections.push({
    title: 'Mi día',
    items: [
      { href: '/app', label: 'Inicio', icon: 'House', roles: [...CLUB_ROLES_ALL] },
      { href: '/app/profile', label: 'Mi perfil', icon: 'User', roles: [...CLUB_ROLES_ALL] },
    ],
  });

  if (hasAny(['owner', 'admin', 'instructor'])) {
    sections.push({
      title: 'Hípica',
      items: [
        { href: '/app/horses', label: 'Caballos', icon: 'Horse', roles: ['owner', 'admin', 'instructor'] },
        { href: '/app/riders', label: 'Alumnos', icon: 'GraduationCap', roles: ['owner', 'admin', 'instructor'] },
        { href: '/app/courses', label: 'Cursos', icon: 'BookOpenText', roles: ['owner', 'admin', 'instructor'] },
        { href: '/app/lessons', label: 'Clases', icon: 'CalendarBlank', roles: ['owner', 'admin', 'instructor'] },
        { href: '/app/events', label: 'Eventos', icon: 'Trophy', roles: ['owner', 'admin', 'instructor'] },
        { href: '/app/news', label: 'Noticias', icon: 'Newspaper', roles: ['owner', 'admin', 'instructor'] },
        { href: '/app/bonos', label: 'Bonos', icon: 'Ticket', roles: ['owner', 'admin', 'instructor'] },
        { href: '/app/badges', label: 'Insignias', icon: 'Medal', roles: ['owner', 'admin', 'instructor'] },
      ],
    });
    sections.push({
      title: 'Inteligencia',
      items: [
        { href: '/app/ai', label: 'Bandeja IA', icon: 'MicrophoneStage', roles: ['owner', 'admin', 'instructor'] },
      ],
    });
  }

  if (hasAny(['owner', 'admin'])) {
    sections.push({
      title: 'Administración',
      items: [
        { href: '/app/staff', label: 'Equipo', icon: 'Users', roles: ['owner', 'admin'] },
        { href: '/app/care-templates', label: 'Plantillas de cuidado', icon: 'ClipboardText', roles: ['owner', 'admin'] },
        { href: '/app/club-settings', label: 'Ajustes del centro', icon: 'Gear', roles: ['owner', 'admin'] },
      ],
    });
  }

  if (hasAny(['rider'])) {
    sections.push({
      title: 'Mi cuenta',
      items: [
        { href: '/app/me', label: 'Mi panel', icon: 'User', roles: ['rider'] },
        { href: '/app/me/lessons', label: 'Mis clases', icon: 'CalendarBlank', roles: ['rider'] },
        { href: '/app/me/courses', label: 'Cursos', icon: 'BookOpenText', roles: ['rider'] },
        { href: '/app/me/horses', label: 'Mis caballos', icon: 'Horse', roles: ['rider'] },
        { href: '/app/me/badges', label: 'Insignias', icon: 'Medal', roles: ['rider'] },
        { href: '/app/me/events', label: 'Eventos', icon: 'Trophy', roles: ['rider'] },
        { href: '/app/me/bonos', label: 'Bonos', icon: 'Ticket', roles: ['rider'] },
      ],
    });
  }

  if (hasAny(['provider'])) {
    sections.push({
      title: 'Proveedor',
      items: [
        { href: '/app/provider', label: 'Mi agenda', icon: 'Stethoscope', roles: ['provider'] },
      ],
    });
  }

  // Mensajería y red social: para todos los roles autenticados
  sections.push({
    title: 'Comunidad',
    items: [
      { href: '/app/messages', label: 'Mensajes', icon: 'ChatCircle', roles: [...CLUB_ROLES_ALL] },
      { href: '/app/feed', label: 'Feed', icon: 'Sparkle', roles: [...CLUB_ROLES_ALL] },
      { href: '/app/people', label: 'Personas', icon: 'UsersThree', roles: [...CLUB_ROLES_ALL] },
    ],
  });

  if (hasAny(['horse_owner'])) {
    sections.push({
      title: 'Mis caballos',
      items: [
        { href: '/app/horse-owner', label: 'Panel propietario', icon: 'Horse', roles: ['horse_owner'] },
      ],
    });
  }

  if (hasAny(['groom'])) {
    sections.push({
      title: 'Cuadra',
      items: [
        { href: '/app/groom', label: 'Mi día (mozo)', icon: 'ClipboardText', roles: ['groom'] },
      ],
    });
  }

  sections.push({
    title: 'Ayuda',
    items: [
      { href: '/help/como-empezar', label: 'Centro de ayuda', icon: 'Question', roles: [...CLUB_ROLES_ALL] },
    ],
  });

  return sections;
}

const CLUB_ROLES_ALL: ClubRole[] = [
  'provider',
  'owner',
  'admin',
  'instructor',
  'groom',
  'horse_owner',
  'rider',
];
