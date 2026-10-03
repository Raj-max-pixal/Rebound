alter table public.profiles add column if not exists about text check (char_length(about) <= 280);
alter table public.profiles add column if not exists birth_date date check (birth_date <= current_date);
alter table public.profiles add column if not exists location text check (char_length(location) <= 100);
alter table public.profiles add column if not exists avatar_color text not null default '#f6b35f' check (avatar_color in ('#f6b35f','#e9857f','#728bc4','#73a989','#9c7dc1'));
