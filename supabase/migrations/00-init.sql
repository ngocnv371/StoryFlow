-- ============================================================
-- Quick Exam Gen — initial schema (core)
-- ============================================================

-- ------------------------------------------------------------
-- Utility: auto-update updated_at column
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. profiles
-- ============================================================
create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: owner select"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: owner update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- 2. projects
-- ============================================================
create table public.projects (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  title       text        not null,
  type        text        not null default 'story',
  tags        TEXT[]      default '{}',
  status      text        not null default 'draft'
                check (status in ('draft', 'pending', 'ready', 'processing', 'failed', 'done', 'archived')),
  metadata    jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "projects: owner select"
  on public.projects for select
  using (user_id = auth.uid());

create policy "projects: owner insert"
  on public.projects for insert
  with check (user_id = auth.uid());

create policy "projects: owner update"
  on public.projects for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "projects: owner delete"
  on public.projects for delete
  using (user_id = auth.uid());

-- ============================================================
-- 3. Initialize profile row on new user sign-up
-- ============================================================
create or replace function public.init_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict do nothing;

  return new;
end;
$$;

create trigger trg_new_user_init_profile
  after insert on auth.users
  for each row execute function public.init_profile();

-- ============================================================
-- 4. Indexes
-- ============================================================
create index idx_projects_user_id
  on public.projects (user_id);

-- ============================================================
-- 5. Grants for authenticated role
-- ============================================================
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
