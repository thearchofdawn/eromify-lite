-- Eromify Lite database + storage schema
create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  visual_profile text not null default '',
  reference_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id uuid references public.personas(id) on delete set null,
  prompt text not null,
  aspect_ratio text not null check (aspect_ratio in ('1:1','4:5','9:16','16:9')),
  count integer not null default 1 check (count between 1 and 8),
  provider text not null default 'demo',
  provider_job_id text,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id uuid references public.personas(id) on delete set null,
  job_id uuid references public.generation_jobs(id) on delete set null,
  asset_type text not null check (asset_type in ('image','video')),
  storage_path text,
  external_url text,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

alter table public.personas enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.assets enable row level security;

grant select, insert, update, delete on public.personas to authenticated;
grant select, insert, update, delete on public.generation_jobs to authenticated;
grant select, insert, update, delete on public.assets to authenticated;

drop policy if exists "personas_select_own" on public.personas;
create policy "personas_select_own" on public.personas for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "personas_insert_own" on public.personas;
create policy "personas_insert_own" on public.personas for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "personas_update_own" on public.personas;
create policy "personas_update_own" on public.personas for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "personas_delete_own" on public.personas;
create policy "personas_delete_own" on public.personas for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "jobs_select_own" on public.generation_jobs;
create policy "jobs_select_own" on public.generation_jobs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "jobs_insert_own" on public.generation_jobs;
create policy "jobs_insert_own" on public.generation_jobs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "jobs_update_own" on public.generation_jobs;
create policy "jobs_update_own" on public.generation_jobs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "assets_select_own" on public.assets;
create policy "assets_select_own" on public.assets for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "assets_insert_own" on public.assets;
create policy "assets_insert_own" on public.assets for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "assets_delete_own" on public.assets;
create policy "assets_delete_own" on public.assets for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('references', 'references', false)
on conflict (id) do nothing;

drop policy if exists "reference_select_own" on storage.objects;
create policy "reference_select_own" on storage.objects for select to authenticated
using (bucket_id = 'references' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "reference_insert_own" on storage.objects;
create policy "reference_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'references' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "reference_update_own" on storage.objects;
create policy "reference_update_own" on storage.objects for update to authenticated
using (bucket_id = 'references' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'references' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "reference_delete_own" on storage.objects;
create policy "reference_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'references' and (storage.foldername(name))[1] = (select auth.uid())::text);
