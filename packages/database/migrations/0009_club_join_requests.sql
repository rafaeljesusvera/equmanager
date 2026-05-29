-- =============================================================================
-- 0009 — Solicitudes de unión a clubes (operativos o del directorio)
-- =============================================================================
-- Cuando un alumno/monitor/mozo/propietario-caballo elige su(s) club(es) en
-- el onboarding:
--   · Si el club YA opera en Equmanager (existe clubs.directory_club_id =
--     directory_club_id), creamos directamente el club_member.
--   · Si no, dejamos constancia aquí para avisarle cuando alguien reclame
--     ese padrón y para notificar interés a admin.
-- =============================================================================

create table if not exists public.club_join_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  directory_club_id uuid references public.directory_clubs(id) on delete set null,
  club_id uuid references public.clubs(id) on delete cascade,
  requested_role club_role not null,
  status text not null default 'pendiente',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_join_requests_profile_idx
  on public.club_join_requests(profile_id);
create index if not exists club_join_requests_directory_idx
  on public.club_join_requests(directory_club_id);
create index if not exists club_join_requests_club_idx
  on public.club_join_requests(club_id);

drop trigger if exists set_updated_at on public.club_join_requests;
create trigger set_updated_at
  before update on public.club_join_requests
  for each row execute function public.set_updated_at();

alter table public.club_join_requests enable row level security;

drop policy if exists "join_requests_self_read" on public.club_join_requests;
create policy "join_requests_self_read" on public.club_join_requests
  for select using (profile_id = auth.uid());

drop policy if exists "join_requests_self_write" on public.club_join_requests;
create policy "join_requests_self_write" on public.club_join_requests
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Owner/admin del club destino también puede leerlas y resolverlas.
drop policy if exists "join_requests_club_admin_read" on public.club_join_requests;
create policy "join_requests_club_admin_read" on public.club_join_requests
  for select using (
    club_id is not null and public.is_club_admin(club_id)
  );

drop policy if exists "join_requests_club_admin_write" on public.club_join_requests;
create policy "join_requests_club_admin_write" on public.club_join_requests
  for update using (
    club_id is not null and public.is_club_admin(club_id)
  );
