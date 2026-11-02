-- ==========================================================================
-- MISJ STUCO — HERO ANNOUNCEMENT · Supabase setup
-- Run this once: Supabase dashboard → SQL Editor → New query → paste → Run.
-- It is safe to run again.
--
-- Run lost-found-setup.sql first: this uses its lf_librarians admin list, so
-- anyone who can manage Lost & Found can also post announcements.
-- ==========================================================================

-- 1. The announcement: always one row, each publish replaces it ---------------

create table if not exists public.hero_announcement (
  id int primary key default 1 check (id = 1),
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 600),
  image_path text not null,
  updated_at timestamptz not null default now()
);

alter table public.hero_announcement enable row level security;

-- 2. Table rules ---------------------------------------------------------------

-- The homepage is public, so anyone may read it, signed in or not.
drop policy if exists "hero: anyone can view" on public.hero_announcement;
create policy "hero: anyone can view" on public.hero_announcement
  for select to anon, authenticated
  using (true);

drop policy if exists "hero: admins add" on public.hero_announcement;
create policy "hero: admins add" on public.hero_announcement
  for insert to authenticated
  with check (public.lf_is_librarian());

drop policy if exists "hero: admins edit" on public.hero_announcement;
create policy "hero: admins edit" on public.hero_announcement
  for update to authenticated
  using (public.lf_is_librarian())
  with check (public.lf_is_librarian());

-- 3. Public photo storage (unlike Lost & Found, these are meant to be seen) ----

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('announcements', 'announcements', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true;

drop policy if exists "hero photos: anyone can view" on storage.objects;
create policy "hero photos: anyone can view" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'announcements');

drop policy if exists "hero photos: admins upload" on storage.objects;
create policy "hero photos: admins upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'announcements' and public.lf_is_librarian());

drop policy if exists "hero photos: admins remove" on storage.objects;
create policy "hero photos: admins remove" on storage.objects
  for delete to authenticated
  using (bucket_id = 'announcements' and public.lf_is_librarian());
