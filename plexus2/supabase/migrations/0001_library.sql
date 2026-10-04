-- =====================================================================
-- Plexus — Library/Editor schema + RLS  (migration 0001)
-- =====================================================================
-- Run this ONCE now. It creates exactly the Library/Editor backend:
--   profiles (+ is_admin), sources, concepts, concept_sources,
--   connections, connection_concepts, connection_sources,
--   plus verification_status on concepts & connections, indexes,
--   updated_at triggers, and full Row Level Security.
-- Daily Plexus and Race Mode tables are intentionally NOT here — they live in
-- 0002_daily_race.sql and should be run later.
--
-- WHERE TO RUN: Supabase Dashboard → SQL Editor → New query → paste ALL of
-- this → Run. It is additive and safe; it creates nothing the app needs until
-- the VITE_ env vars are also set (otherwise the app keeps using local content).
--
-- Security in one line: anyone can READ verified, non-archived content; only
-- ADMINS (profiles.is_admin = true) can write it; each user manages only their
-- own profile. The service_role key bypasses RLS and must stay off the browser.
-- =====================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ---------------------------------------------------------------------
-- PROFILES (id = auth.users.id) + admin flag
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique,
  display_name text,
  avatar_url   text,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- SOURCES
-- ---------------------------------------------------------------------
create table if not exists public.sources (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  edition_year   int,
  page_reference text,
  notes          text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CONCEPTS (reusable; one concept can appear in many connections)
-- ---------------------------------------------------------------------
create table if not exists public.concepts (
  id                     uuid primary key default gen_random_uuid(),
  canonical_name         text not null unique,          -- natural key (import idempotency)
  synonyms               text[] not null default '{}',
  organ_systems          text[] not null default '{}',
  subcategory            text,
  concept_types          text[] not null default '{}',
  difficulty             text,
  buzzwords              text[] not null default '{}',
  mechanism              text,
  signs_symptoms         text[] not null default '{}',
  labs                   text[] not null default '{}',
  pathology              text,
  imaging                text,
  associated_drugs       text[] not null default '{}',
  adverse_effects        text[] not null default '{}',
  contraindications      text[] not null default '{}',
  organisms              text[] not null default '{}',
  genetic_associations   text[] not null default '{}',
  hla_associations       text[] not null default '{}',
  complications          text[] not null default '{}',
  differential_diagnoses text[] not null default '{}',
  notes                  text,
  verification_status    text not null default 'needs_review'
                           check (verification_status in ('verified','needs_review','rejected')),
  archived               boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
drop trigger if exists trg_concepts_updated on public.concepts;
create trigger trg_concepts_updated before update on public.concepts
  for each row execute function public.set_updated_at();
create index if not exists idx_concepts_status  on public.concepts (verification_status, archived);
create index if not exists idx_concepts_systems on public.concepts using gin (organ_systems);

create table if not exists public.concept_sources (
  concept_id uuid not null references public.concepts (id) on delete cascade,
  source_id  uuid not null references public.sources (id) on delete cascade,
  primary key (concept_id, source_id)
);

-- ---------------------------------------------------------------------
-- CONNECTIONS (+ join tables)
-- ---------------------------------------------------------------------
create table if not exists public.connections (
  id                  uuid primary key default gen_random_uuid(),
  external_key        text unique,                      -- bank id, for import idempotency
  title               text not null,
  organ_systems       text[] not null default '{}',
  subcategory         text,
  difficulty          text,
  connection_type     text,
  explanation         text,
  remember            text,
  tags                text[] not null default '{}',
  verification_status text not null default 'needs_review'
                        check (verification_status in ('verified','needs_review','rejected')),
  archived            boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
drop trigger if exists trg_connections_updated on public.connections;
create trigger trg_connections_updated before update on public.connections
  for each row execute function public.set_updated_at();
create index if not exists idx_connections_status  on public.connections (verification_status, archived);
create index if not exists idx_connections_systems on public.connections using gin (organ_systems);

create table if not exists public.connection_concepts (
  connection_id uuid not null references public.connections (id) on delete cascade,
  concept_id    uuid not null references public.concepts (id) on delete cascade,
  position      int not null default 0,
  tile_note     text,
  primary key (connection_id, concept_id)
);
create index if not exists idx_conn_concepts_concept on public.connection_concepts (concept_id);

create table if not exists public.connection_sources (
  connection_id uuid not null references public.connections (id) on delete cascade,
  source_id     uuid not null references public.sources (id) on delete cascade,
  primary key (connection_id, source_id)
);

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.sources             enable row level security;
alter table public.concepts            enable row level security;
alter table public.concept_sources     enable row level security;
alter table public.connections         enable row level security;
alter table public.connection_concepts enable row level security;
alter table public.connection_sources  enable row level security;

-- profiles
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles for select using (true);
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert with check (id = auth.uid());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- sources
drop policy if exists sources_select_public on public.sources;
create policy sources_select_public on public.sources for select using (true);
drop policy if exists sources_admin_write on public.sources;
create policy sources_admin_write on public.sources for all using (public.is_admin()) with check (public.is_admin());

-- concepts
drop policy if exists concepts_select_public on public.concepts;
create policy concepts_select_public on public.concepts
  for select using ((verification_status = 'verified' and archived = false) or public.is_admin());
drop policy if exists concepts_admin_write on public.concepts;
create policy concepts_admin_write on public.concepts for all using (public.is_admin()) with check (public.is_admin());

-- connections
drop policy if exists connections_select_public on public.connections;
create policy connections_select_public on public.connections
  for select using ((verification_status = 'verified' and archived = false) or public.is_admin());
drop policy if exists connections_admin_write on public.connections;
create policy connections_admin_write on public.connections for all using (public.is_admin()) with check (public.is_admin());

-- join tables (readable; admin writes)
drop policy if exists concept_sources_select on public.concept_sources;
create policy concept_sources_select on public.concept_sources for select using (true);
drop policy if exists concept_sources_admin_write on public.concept_sources;
create policy concept_sources_admin_write on public.concept_sources for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists connection_concepts_select on public.connection_concepts;
create policy connection_concepts_select on public.connection_concepts for select using (true);
drop policy if exists connection_concepts_admin_write on public.connection_concepts;
create policy connection_concepts_admin_write on public.connection_concepts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists connection_sources_select on public.connection_sources;
create policy connection_sources_select on public.connection_sources for select using (true);
drop policy if exists connection_sources_admin_write on public.connection_sources;
create policy connection_sources_admin_write on public.connection_sources for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Auto-create a profile row on new signup (so is_admin can be toggled).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
