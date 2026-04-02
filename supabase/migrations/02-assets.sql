-- ============================================================
-- Migration 01 — assets table + storage buckets
-- ============================================================

-- ============================================================
-- 1. assets
-- ============================================================
create table public.assets (
  id           uuid        primary key default gen_random_uuid(),
  project_id   uuid        not null references public.projects(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null,
  mime_type    text,
  size         bigint,
  storage_path text        not null,
  visibility   text        not null default 'private'
                 check (visibility in ('public', 'private')),
  metadata     jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_assets_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

alter table public.assets enable row level security;

create policy "assets: owner select"
  on public.assets for select
  using (user_id = auth.uid());

create policy "assets: owner insert"
  on public.assets for insert
  with check (user_id = auth.uid());

create policy "assets: owner update"
  on public.assets for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "assets: owner delete"
  on public.assets for delete
  using (user_id = auth.uid());

-- ============================================================
-- 2. Indexes
-- ============================================================
create index idx_assets_project_id
  on public.assets (project_id);

create index idx_assets_user_id
  on public.assets (user_id);

-- ============================================================
-- 3. Grants
-- ============================================================
grant select, insert, update, delete on public.assets to authenticated;

-- ============================================================
-- 4. Storage buckets
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'public-assets',
    'public-assets',
    true,
    52428800,   -- 50 MB
    null        -- all mime types allowed
  ),
  (
    'private-assets',
    'private-assets',
    false,
    52428800,   -- 50 MB
    null
  )
on conflict (id) do nothing;

-- ============================================================
-- 5. Storage RLS policies — public-assets bucket
-- ============================================================

-- Anyone can read objects in the public bucket
create policy "public-assets: public read"
  on storage.objects for select
  using (bucket_id = 'public-assets');

-- Authenticated owners can upload under their own user folder
create policy "public-assets: owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "public-assets: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "public-assets: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 6. Storage RLS policies — private-assets bucket
-- ============================================================

create policy "private-assets: owner select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'private-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "private-assets: owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'private-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "private-assets: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'private-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "private-assets: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'private-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
