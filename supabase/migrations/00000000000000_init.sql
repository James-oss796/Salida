-- Initialization migration for Salida MVP
-- Contains schema, storage policies, triggers, and Row Level Security.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  display_name text,
  avatar_url text,
  bio text check (char_length(bio) <= 160),
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  caption text check (char_length(caption) <= 300),
  video_path text not null,
  thumbnail_path text,
  duration_seconds int,
  width int, height int,
  size_bytes bigint,
  like_count int not null default 0,
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);
create index videos_feed_idx on public.videos (created_at desc) where status = 'published';
create index videos_owner_idx on public.videos (owner_id, created_at desc);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  artist text not null check (char_length(artist) between 1 and 100),
  album text,
  audio_path text not null,
  cover_path text,
  duration_seconds int,
  size_bytes bigint,
  like_count int not null default 0,
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);
create index tracks_list_idx on public.tracks (created_at desc) where status = 'published';

create table public.images (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  caption text check (char_length(caption) <= 300),
  image_path text not null,
  thumbnail_path text,
  width int, height int,
  size_bytes bigint,
  like_count int not null default 0,
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);
create index images_list_idx on public.images (created_at desc) where status = 'published';

create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('video','track','image')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.playlist_tracks (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  position int not null,
  added_at timestamptz not null default now(),
  primary key (playlist_id, track_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('video','track','image')),
  item_id uuid not null,
  reason text not null,
  note text,
  status text not null default 'open' check (status in ('open','reviewed')),
  created_at timestamptz not null default now()
);

-- TRIGGERS
-- Create a profile automatically when someone signs up (Google or email).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 8),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep like_count in sync.
create or replace function public.bump_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text; i uuid; d int;
begin
  if tg_op = 'INSERT' then t := new.item_type; i := new.item_id; d := 1;
  else t := old.item_type; i := old.item_id; d := -1; end if;

  if t = 'video' then
    update public.videos set like_count = greatest(like_count + d, 0) where id = i;
  elsif t = 'track' then
    update public.tracks set like_count = greatest(like_count + d, 0) where id = i;
  elsif t = 'image' then
    update public.images set like_count = greatest(like_count + d, 0) where id = i;
  end if;
  return null;
end $$;

create trigger likes_count_trg
  after insert or delete on public.likes
  for each row execute function public.bump_like_count();

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles        enable row level security;
alter table public.videos          enable row level security;
alter table public.tracks          enable row level security;
alter table public.images          enable row level security;
alter table public.likes           enable row level security;
alter table public.playlists       enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.reports         enable row level security;

-- profiles: public read, owner edits only safe columns
create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url, bio) on public.profiles to authenticated;

-- videos
create policy "videos readable" on public.videos for select
  using (status = 'published' or owner_id = auth.uid());
create policy "videos insert own" on public.videos for insert to authenticated
  with check (owner_id = auth.uid());
create policy "videos update own" on public.videos for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "videos delete own" on public.videos for delete to authenticated
  using (owner_id = auth.uid());
revoke update on public.videos from authenticated;
grant update (title, caption) on public.videos to authenticated;

-- tracks
create policy "tracks readable" on public.tracks for select
  using (status = 'published' or owner_id = auth.uid());
create policy "tracks insert own" on public.tracks for insert to authenticated
  with check (owner_id = auth.uid());
create policy "tracks update own" on public.tracks for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "tracks delete own" on public.tracks for delete to authenticated
  using (owner_id = auth.uid());
revoke update on public.tracks from authenticated;
grant update (title, artist, album) on public.tracks to authenticated;

-- images
create policy "images readable" on public.images for select
  using (status = 'published' or owner_id = auth.uid());
create policy "images insert own" on public.images for insert to authenticated
  with check (owner_id = auth.uid());
create policy "images update own" on public.images for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "images delete own" on public.images for delete to authenticated
  using (owner_id = auth.uid());
revoke update on public.images from authenticated;
grant update (caption) on public.images to authenticated;

-- likes: users see and manage only their own
create policy "likes select own" on public.likes for select to authenticated using (user_id = auth.uid());
create policy "likes insert own" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "likes delete own" on public.likes for delete to authenticated using (user_id = auth.uid());

-- playlists
create policy "playlists readable" on public.playlists for select
  using (is_public or owner_id = auth.uid());
create policy "playlists insert own" on public.playlists for insert to authenticated with check (owner_id = auth.uid());
create policy "playlists update own" on public.playlists for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "playlists delete own" on public.playlists for delete to authenticated using (owner_id = auth.uid());

create policy "playlist_tracks readable" on public.playlist_tracks for select using (
  exists (select 1 from public.playlists p
          where p.id = playlist_id and (p.is_public or p.owner_id = auth.uid())));
create policy "playlist_tracks write own" on public.playlist_tracks for all to authenticated
  using (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()));

-- reports: users can file, nobody can read them from the app (admin reads in dashboard)
create policy "reports insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid());

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
 ('videos','videos',true,52428800, array['video/mp4','video/quicktime']),
 ('music','music',true,20971520, array['audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/x-m4a','audio/ogg']),
 ('images','images',true,10485760, array['image/jpeg','image/png','image/webp']),
 ('thumbnails','thumbnails',true,2097152, array['image/jpeg','image/webp']),
 ('avatars','avatars',true,2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "users upload to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('videos','music','images','thumbnails','avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own files" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('videos','music','images','thumbnails','avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
