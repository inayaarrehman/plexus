-- =====================================================================
-- Plexus — Daily Plexus + Race Mode schema + RLS  (migration 0002)
-- =====================================================================
-- DO NOT RUN THIS YET. It is here for the next phase (Daily Plexus and live
-- Race Mode). Run 0001_library.sql first and confirm the Editor works; come
-- back to this only when you start building Daily / Race. Requires 0001 to
-- have been applied (it reuses set_updated_at / auth.users / profiles).
-- =====================================================================

-- ---- DAILY PLEXUS ----
create table if not exists public.daily_puzzles (
  id          uuid primary key default gen_random_uuid(),
  puzzle_date date not null,
  seed        text not null,
  puzzle_data jsonb not null,
  status      text not null default 'published' check (status in ('draft','published','archived')),
  created_at  timestamptz not null default now()
);
-- Exactly one PUBLISHED puzzle per date (drafts may coexist).
create unique index if not exists uniq_daily_published_per_date
  on public.daily_puzzles (puzzle_date) where status = 'published';
create index if not exists idx_daily_date on public.daily_puzzles (puzzle_date);

create table if not exists public.user_daily_results (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  puzzle_id          uuid not null references public.daily_puzzles (id) on delete cascade,
  completed          boolean not null default false,
  mistakes           int not null default 0,
  completion_time_ms int,
  completed_at       timestamptz,
  unique (user_id, puzzle_id)
);
create index if not exists idx_results_user on public.user_daily_results (user_id);

-- ---- RACE MODE ----
create table if not exists public.races (
  id           uuid primary key default gen_random_uuid(),
  join_code    text not null unique,
  seed         text not null,
  status       text not null default 'lobby' check (status in ('lobby','countdown','active','finished','abandoned')),
  host_user_id uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  finished_at  timestamptz
);
create index if not exists idx_races_code on public.races (join_code);

create table if not exists public.race_players (
  id           uuid primary key default gen_random_uuid(),
  race_id      uuid not null references public.races (id) on delete cascade,
  user_id      uuid references auth.users (id) on delete cascade,
  display_name text,
  progress     int not null default 0,
  score        int not null default 0,
  mistakes     int not null default 0,
  ready        boolean not null default false,
  finished_at  timestamptz,
  unique (race_id, user_id)
);
create index if not exists idx_race_players_race on public.race_players (race_id);

create or replace function public.is_race_participant(p_race_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.race_players rp where rp.race_id = p_race_id and rp.user_id = auth.uid())
      or exists (select 1 from public.races r where r.id = p_race_id and r.host_user_id = auth.uid());
$$;

alter table public.daily_puzzles      enable row level security;
alter table public.user_daily_results enable row level security;
alter table public.races              enable row level security;
alter table public.race_players       enable row level security;

create policy daily_select_published on public.daily_puzzles
  for select using (status = 'published' or public.is_admin());
create policy daily_admin_write on public.daily_puzzles
  for all using (public.is_admin()) with check (public.is_admin());

create policy results_select_own on public.user_daily_results for select using (user_id = auth.uid());
create policy results_insert_own on public.user_daily_results for insert with check (user_id = auth.uid());
create policy results_update_own on public.user_daily_results for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy races_select_auth on public.races for select using (auth.uid() is not null);
create policy races_insert_host on public.races for insert with check (host_user_id = auth.uid());
create policy races_update_host on public.races for update using (host_user_id = auth.uid()) with check (host_user_id = auth.uid());
create policy races_delete_host on public.races for delete using (host_user_id = auth.uid());

create policy race_players_select_participant on public.race_players for select using (public.is_race_participant(race_id));
create policy race_players_insert_self on public.race_players for insert with check (user_id = auth.uid());
create policy race_players_update_self on public.race_players for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy race_players_delete_self on public.race_players for delete using (user_id = auth.uid());

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.race_players';
    execute 'alter publication supabase_realtime add table public.races';
  end if;
exception when duplicate_object then null;
end $$;
