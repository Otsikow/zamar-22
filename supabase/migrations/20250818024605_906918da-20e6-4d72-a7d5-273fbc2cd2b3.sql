-- 1) Ensure the columns your dashboard needs exist
alter table public.profiles
  add column if not exists membership_tier text
    check (membership_tier in ('listener','supporter')) default 'listener';

alter table public.profiles
  add column if not exists full_name text;

-- 2) Trigger function to create a profiles row whenever a new auth.user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, is_admin, membership_tier)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),  -- fall back to email
    false,
    'listener'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 3) Attach the trigger to auth.users (fires for future signups)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 4) Backfill profiles for existing users (fix today's counts)
insert into public.profiles (id, full_name, is_admin, membership_tier)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.email),
  false,
  'listener'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 5) RLS policy for reading profiles
alter table public.profiles enable row level security;

-- Anyone logged in can read lightweight profile fields (for counts/labels).
drop policy if exists p_profiles_read_public on public.profiles;
create policy p_profiles_read_public
on public.profiles for select
using (true);

-- 6) Auto-promote to supporter after payment function
create or replace function public.promote_to_supporter(uid uuid)
returns void
language sql
security definer
as $$
  update public.profiles
  set membership_tier = 'supporter'
  where id = uid;
$$;