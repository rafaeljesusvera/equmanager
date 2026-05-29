/**
 * Solicitudes de unión a clubes (operativos o del directorio).
 * Ver migración 0009 para el contexto.
 */
import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { clubRoleEnum, clubs, profiles } from './clubs';
import { directoryClubs } from './directory';

export const clubJoinRequests = pgTable(
  'club_join_requests',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    directoryClubId: uuid('directory_club_id').references(
      () => directoryClubs.id,
      { onDelete: 'set null' },
    ),
    clubId: uuid('club_id').references(() => clubs.id, {
      onDelete: 'cascade',
    }),
    requestedRole: clubRoleEnum('requested_role').notNull(),
    status: text('status').notNull().default('pendiente'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byProfile: index('club_join_requests_profile_idx').on(t.profileId),
    byDirectory: index('club_join_requests_directory_idx').on(
      t.directoryClubId,
    ),
    byClub: index('club_join_requests_club_idx').on(t.clubId),
  }),
);
