-- Run in the Supabase SQL editor after creating the project. The existing D1
-- database remains active until a user-data migration is intentionally made.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now()
);
create table if not exists public.academic_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{"terms":[],"holidays":[],"subjects":[],"blocks":[],"exams":[]}'::jsonb,
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.academic_states enable row level security;
create policy "Users manage their profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users manage their academic state" on public.academic_states for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
