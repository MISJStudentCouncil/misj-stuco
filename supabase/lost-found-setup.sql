-- ==========================================================================
-- MISJ STUCO — LOST & FOUND · Supabase setup
-- Run this once: Supabase dashboard → SQL Editor → New query → paste → Run.
-- It is safe to run again.
--
-- Before running, change the two values in step 6 (your school's email
-- domain and the librarian's email). You can also edit them later in
-- Table Editor → lf_domains / lf_librarians.
-- ==========================================================================

-- 1. Who may use it ---------------------------------------------------------

-- School email domains, e.g. 'misj.sch.id' (no @). Add one row per domain.
create table if not exists public.lf_domains (
  domain text primary key check (domain = lower(domain) and domain not like '%@%')
);

-- People who may upload and remove items (the librarian, plus any helpers).
create table if not exists public.lf_librarians (
  email text primary key check (email = lower(email))
);

alter table public.lf_domains enable row level security;
alter table public.lf_librarians enable row level security;
-- No policies on purpose: these two tables are only edited in the dashboard.

-- 2. The items ---------------------------------------------------------------

-- What students can see: the photo, nothing else.
create table if not exists public.lost_items (
  id uuid primary key default gen_random_uuid(),
  image_path text not null unique,
  created_at timestamptz not null default now()
);

-- What only admins can see: the description and the date it was handed in.
create table if not exists public.lost_item_notes (
  item_id uuid primary key references public.lost_items (id) on delete cascade,
  description text not null default '',
  found_on date not null default current_date
);
-- for projects set up before the date was added
alter table public.lost_item_notes add column if not exists found_on date not null default current_date;

alter table public.lost_items enable row level security;
alter table public.lost_item_notes enable row level security;

-- 3. The checks (run on Supabase's server, so they can't be bypassed) --------

-- A signed-in user with a confirmed email on one of the school domains.
create or replace function public.lf_is_student()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.lf_domains d on d.domain = lower(split_part(u.email, '@', 2))
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;

-- A signed-in user with a confirmed email listed in lf_librarians.
create or replace function public.lf_is_librarian()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.lf_librarians l on l.email = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.lf_is_student() from public, anon;
revoke all on function public.lf_is_librarian() from public, anon;
grant execute on function public.lf_is_student() to authenticated;
grant execute on function public.lf_is_librarian() to authenticated;

-- 4. Table rules --------------------------------------------------------------

drop policy if exists "lf items: school can view" on public.lost_items;
create policy "lf items: school can view" on public.lost_items
  for select to authenticated
  using (public.lf_is_student() or public.lf_is_librarian());

drop policy if exists "lf items: librarian adds" on public.lost_items;
create policy "lf items: librarian adds" on public.lost_items
  for insert to authenticated
  with check (public.lf_is_librarian());

drop policy if exists "lf items: librarian removes" on public.lost_items;
create policy "lf items: librarian removes" on public.lost_items
  for delete to authenticated
  using (public.lf_is_librarian());

drop policy if exists "lf notes: librarian only" on public.lost_item_notes;
create policy "lf notes: librarian only" on public.lost_item_notes
  for all to authenticated
  using (public.lf_is_librarian())
  with check (public.lf_is_librarian());

-- 5. Private photo storage ----------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lost-found', 'lost-found', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false;

drop policy if exists "lf photos: school can view" on storage.objects;
create policy "lf photos: school can view" on storage.objects
  for select to authenticated
  using (bucket_id = 'lost-found' and (public.lf_is_student() or public.lf_is_librarian()));

drop policy if exists "lf photos: librarian uploads" on storage.objects;
create policy "lf photos: librarian uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lost-found' and public.lf_is_librarian());

drop policy if exists "lf photos: librarian removes" on storage.objects;
create policy "lf photos: librarian removes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lost-found' and public.lf_is_librarian());

-- 6. YOUR VALUES — change these two lines ------------------------------------

insert into public.lf_domains (domain) values ('mis.sch.id') on conflict do nothing;
insert into public.lf_librarians (email) values ('students_council@mis.sch.id') on conflict do nothing;
-- the shared account is the only admin
delete from public.lf_librarians where email <> 'students_council@mis.sch.id';
