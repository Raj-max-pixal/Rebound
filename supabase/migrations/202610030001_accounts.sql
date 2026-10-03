begin;
create table public.rebound_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (char_length(display_name)<=60),
 birth_date date check (birth_date between date '1900-01-01' and current_date),
 avatar jsonb not null default '{}' check (jsonb_typeof(avatar)='object' and octet_length(avatar::text)<=4096),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 last_seen_at timestamptz,
 last_login_at timestamptz
);
create table public.rebound_activity (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event text not null check (event in ('app_open','screen_view','focus_start','focus_pause','profile_saved','avatar_saved')),
 screen text check (screen in ('home','focus','rebound','insights','profile','account','town')),
 created_at timestamptz not null default now()
);
create index rebound_activity_user_time on public.rebound_activity(user_id,created_at desc);
alter table public.rebound_profiles enable row level security;
alter table public.rebound_activity enable row level security;
revoke all on public.rebound_profiles, public.rebound_activity from anon,authenticated;
grant select on public.rebound_profiles, public.rebound_activity to authenticated;
grant update(display_name,birth_date,avatar) on public.rebound_profiles to authenticated;
create policy own_profile_read on public.rebound_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy own_profile_edit on public.rebound_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_activity_read on public.rebound_activity for select to authenticated using ((select auth.uid())=user_id);

create function public.rebound_new_account() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.rebound_profiles(user_id,last_login_at) values(new.id,new.last_sign_in_at) on conflict do nothing;
 return new;
end; $$;
create trigger rebound_account_created after insert on auth.users for each row execute function public.rebound_new_account();
insert into public.rebound_profiles(user_id,last_login_at) select id,last_sign_in_at from auth.users on conflict do nothing;
create function public.rebound_login_time() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.rebound_profiles set last_login_at=new.last_sign_in_at where user_id=new.id;
 return new;
end; $$;
create trigger rebound_login_updated after update of last_sign_in_at on auth.users for each row execute function public.rebound_login_time();
create function public.rebound_profile_time() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end; $$;
create trigger rebound_profile_updated before update on public.rebound_profiles for each row execute function public.rebound_profile_time();

-- Server timestamps and an authenticated identity; callers cannot submit another user ID.
create function public.rebound_record_activity(p_event text,p_screen text default null) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); previous_seen timestamptz;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if p_event not in ('app_open','screen_view','focus_start','focus_pause','profile_saved','avatar_saved','heartbeat') then raise exception 'Invalid event'; end if;
 if p_screen is not null and p_screen not in ('home','focus','rebound','insights','profile','account','town') then raise exception 'Invalid screen'; end if;
 select last_seen_at into previous_seen from public.rebound_profiles where user_id=uid for update;
 if previous_seen is not null and previous_seen>now()-interval '2 seconds' then return; end if;
 update public.rebound_profiles set last_seen_at=now() where user_id=uid;
 if p_event<>'heartbeat' then insert into public.rebound_activity(user_id,event,screen) values(uid,p_event,p_screen); end if;
 delete from public.rebound_activity where user_id=uid and created_at<now()-interval '90 days';
end; $$;
revoke all on function public.rebound_record_activity(text,text) from public,anon;
grant execute on function public.rebound_record_activity(text,text) to authenticated;
revoke all on function public.rebound_new_account(), public.rebound_login_time(), public.rebound_profile_time() from public,anon,authenticated;
commit;
