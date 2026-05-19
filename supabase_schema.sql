-- Audiosa Supabase schema
-- Paste this in Supabase SQL Editor, then run it.

create extension if not exists pgcrypto;

create table if not exists public.listening_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  track_id text not null,
  track_name text not null,
  artist_name text,
  played_at timestamptz not null default now()
);

create index if not exists listening_history_user_played_idx
  on public.listening_history (user_id, played_at desc);

create table if not exists public.partner_shared_tracks (
  id uuid primary key default gen_random_uuid(),
  owner_code text not null,
  partner_code text not null,
  track_id text not null,
  track_name text not null,
  artist_name text,
  thumbnail_url text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists partner_shared_tracks_partner_idx
  on public.partner_shared_tracks (partner_code, created_at desc);

create index if not exists partner_shared_tracks_owner_idx
  on public.partner_shared_tracks (owner_code, created_at desc);

alter table public.listening_history enable row level security;
alter table public.partner_shared_tracks enable row level security;

drop policy if exists "anon can insert listening history" on public.listening_history;
create policy "anon can insert listening history"
  on public.listening_history
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anon can read own listening history by code" on public.listening_history;
create policy "anon can read own listening history by code"
  on public.listening_history
  for select
  to anon, authenticated
  using (true);

drop policy if exists "anon can share tracks" on public.partner_shared_tracks;
create policy "anon can share tracks"
  on public.partner_shared_tracks
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anon can read partner tracks" on public.partner_shared_tracks;
create policy "anon can read partner tracks"
  on public.partner_shared_tracks
  for select
  to anon, authenticated
  using (true);
