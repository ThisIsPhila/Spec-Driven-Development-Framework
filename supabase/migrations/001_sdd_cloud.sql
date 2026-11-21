-- Phase 008: SDD Cloud Account & Multi-Project Snapshot Schema (Supabase Postgres + RLS)

create table if not exists public.sdd_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  name text not null,
  framework_version text not null default '2.4.0',
  active_phase text,
  summary jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create table if not exists public.sdd_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.sdd_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  revision text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sdd_projects_user on public.sdd_projects (user_id, last_synced_at desc);
create index if not exists idx_sdd_snapshots_project on public.sdd_snapshots (project_id, created_at desc);

-- Strict Row-Level Security: every user can only read/write their own projects and snapshots
alter table public.sdd_projects enable row level security;
alter table public.sdd_snapshots enable row level security;

drop policy if exists "sdd_projects_owner_all" on public.sdd_projects;
create policy "sdd_projects_owner_all"
  on public.sdd_projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sdd_snapshots_owner_all" on public.sdd_snapshots;
create policy "sdd_snapshots_owner_all"
  on public.sdd_snapshots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
