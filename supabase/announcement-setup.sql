-- ==========================================================================
-- MISJ STUCO — ANNOUNCEMENTS · Supabase setup
-- Run this once: Supabase dashboard → SQL Editor → New query → paste → Run.
-- It is safe to run again.
--
-- Run lost-found-setup.sql first: this uses its lf_librarians admin list, so
-- anyone who can manage Lost & Found can also post announcements.
-- ==========================================================================

-- 1. Announcements: each one is a slide in the homepage panel ------------------

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 600),
  image_path text not null,
  expires_at timestamptz,    -- leaves the homepage at this time; empty = stays up
  archived_at timestamptz,   -- set when an admin archives it by hand
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- Carry over the single announcement from the first version of this page.
do $$
begin
  if to_regclass('public.hero_announcement') is not null
     and not exists (select 1 from public.announcements) then
    execute 'insert into public.announcements (title, description, image_path, created_at)
             select title, description, image_path, updated_at from public.hero_announcement';
  end if;
end $$;

-- 2. Table rules ---------------------------------------------------------------

-- The homepage is public, but Supabase only hands out what is current. This is
-- the auto-delete: past its end time a row stops being public by itself, with
-- no scheduled job, and stays here as the archive history.
drop policy if exists "announcements: anyone sees current" on public.announcements;
create policy "announcements: anyone sees current" on public.announcements
  for select to anon, authenticated
  using (archived_at is null and (expires_at is null or expires_at > now()));

drop policy if exists "announcements: admins see all" on public.announcements;
create policy "announcements: admins see all" on public.announcements
  for select to authenticated
  using (public.lf_is_librarian());

drop policy if exists "announcements: admins add" on public.announcements;
create policy "announcements: admins add" on public.announcements
  for insert to authenticated
  with check (public.lf_is_librarian());

drop policy if exists "announcements: admins edit" on public.announcements;
create policy "announcements: admins edit" on public.announcements
  for update to authenticated
  using (public.lf_is_librarian())
  with check (public.lf_is_librarian());

drop policy if exists "announcements: admins delete" on public.announcements;
create policy "announcements: admins delete" on public.announcements
  for delete to authenticated
  using (public.lf_is_librarian());

-- 3. Public photo storage (unlike Lost & Found, these are meant to be seen) ----

-- Photos are converted to compressed JPEGs in the admin page, so JPEG is the
-- only type accepted here: PDFs and other files are refused by Supabase too.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('announcements', 'announcements', true, 2097152, array['image/jpeg'])
on conflict (id) do update
  set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg'];

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
