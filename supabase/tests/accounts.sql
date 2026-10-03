-- Run after the migration in a disposable test project. All fixtures roll back.
begin;
insert into auth.users(id,email) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','rebound-test-a@example.invalid'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','rebound-test-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select public.rebound_record_activity('app_open',null);
do $$
declare n integer;
begin
 select count(*) into n from public.rebound_profiles;
 if n<>1 then raise exception 'Profile read isolation failed'; end if;
 update public.rebound_profiles set display_name='Other user' where user_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 get diagnostics n = row_count;
 if n<>0 then raise exception 'Cross-user update allowed'; end if;
 select count(*) into n from public.rebound_activity;
 if n<>1 then raise exception 'Own activity missing'; end if;
 begin
  update public.rebound_profiles set last_login_at=now();
  raise exception 'Protected timestamps writable';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.rebound_activity(user_id,event) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','app_open');
  raise exception 'Activity forgery allowed';
 exception when insufficient_privilege then null; end;
end; $$;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$ begin
 if exists(select 1 from public.rebound_activity) then raise exception 'Activity read isolation failed'; end if;
end; $$;
reset role;
rollback;
