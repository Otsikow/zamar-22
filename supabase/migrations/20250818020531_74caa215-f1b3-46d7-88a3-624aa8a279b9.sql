-- === Extensions (if not already on) ===
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- === Update existing profiles table for referrals ===
-- Add new columns to existing profiles table
alter table public.profiles 
  add column if not exists full_name text,
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.profiles(id) on delete set null;

-- Create generate referral code function
create or replace function public.generate_referral_code(uid uuid)
returns text
language plpgsql
as $$
declare
  code text;
begin
  -- short, readable 7–8 char code from uuid hash
  code := upper(substr(encode(digest(uid::text, 'sha1'), 'hex'), 1, 8));
  return code;
end;
$$;

-- auto-fill referral_code on first insert
create or replace function public.profiles_fill_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null then
    new.referral_code := public.generate_referral_code(new.id);
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_fill_referral_code on public.profiles;
create trigger trg_profiles_fill_referral_code
before insert or update on public.profiles
for each row execute procedure public.profiles_fill_referral_code();

-- quick index for lineage lookups
create index if not exists idx_profiles_referred_by on public.profiles(referred_by);

-- === COMMISSION RULES ===
create table if not exists public.referral_commission_rules (
  generation int primary key check (generation in (1,2)),
  rate numeric(6,4) not null check (rate >= 0 and rate <= 1),
  updated_at timestamptz not null default now()
);

insert into public.referral_commission_rules (generation, rate)
values (1, 0.15)
on conflict (generation) do update set rate = excluded.rate;

insert into public.referral_commission_rules (generation, rate)
values (2, 0.10)
on conflict (generation) do update set rate = excluded.rate;

-- === ORDERS (source of truth from Stripe) ===
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  currency text not null default 'GBP',
  amount_cents integer not null check (amount_cents >= 0),
  stripe_payment_intent text unique,
  status text not null check (status in ('created','requires_action','succeeded','refunded','void')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);

create or replace function public.orders_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_orders_set_updated_at on public.orders;
create trigger trg_orders_set_updated_at
before update on public.orders
for each row execute procedure public.orders_set_updated_at();

-- === COMMISSIONS (records Gen-1 + Gen-2 earnings) ===
create table if not exists public.referral_commissions (
  id uuid primary key default gen_random_uuid(),
  source_order_id uuid not null references public.orders(id) on delete cascade,
  purchaser_user_id uuid not null references public.profiles(id) on delete cascade,
  earner_user_id uuid not null references public.profiles(id) on delete cascade,
  generation int not null check (generation in (1,2)),
  rate numeric(6,4) not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'GBP',
  status text not null default 'pending' check (status in ('pending','paid','void')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  notes text
);

-- avoid duplicates per order+generation
create unique index if not exists uq_commission_per_order_gen
on public.referral_commissions(source_order_id, generation);

create index if not exists idx_comm_earner on public.referral_commissions(earner_user_id);
create index if not exists idx_comm_status on public.referral_commissions(status);

-- === Helper: find Gen1 + Gen2 ancestors ===
create or replace function public.get_referral_ancestors(purchaser uuid)
returns table(generation int, ancestor uuid)
language sql
as $$
  with gen1 as (
    select 1 as generation, p.referred_by as ancestor
    from public.profiles p
    where p.id = purchaser
  ),
  gen2 as (
    select 2 as generation, p2.referred_by as ancestor
    from public.profiles p
    join public.profiles p1 on p1.id = p.referred_by
    join public.profiles p2 on p2.id = p1.id
    where p.id = purchaser
  )
  -- union but only when non-null
  select * from gen1 where ancestor is not null
  union all
  select * from gen2 where ancestor is not null;
$$;

-- === Core: create commissions when an order succeeds ===
create or replace function public.create_commissions_for_order()
returns trigger
language plpgsql
as $$
declare
  rec record;
  rule_rate numeric(6,4);
  commission_amt integer;
begin
  -- Only when order is succeeded
  if (tg_op = 'INSERT' and new.status = 'succeeded')
     or (tg_op = 'UPDATE' and new.status = 'succeeded' and old.status <> 'succeeded') then

    for rec in select * from public.get_referral_ancestors(new.user_id) loop
      -- skip self-referrals just in case
      if rec.ancestor = new.user_id then
        continue;
      end if;

      select rate into rule_rate from public.referral_commission_rules where generation = rec.generation;

      if rule_rate is null then
        continue;
      end if;

      commission_amt := floor(new.amount_cents * rule_rate);

      -- Only create if > 0 and not already created (unique index will also enforce)
      if commission_amt > 0 then
        insert into public.referral_commissions (
          source_order_id, purchaser_user_id, earner_user_id,
          generation, rate, amount_cents, currency, status, notes
        )
        values (
          new.id, new.user_id, rec.ancestor,
          rec.generation, rule_rate, commission_amt, new.currency, 'pending',
          'Auto-created from succeeded order'
        )
        on conflict do nothing;
      end if;
    end loop;
  end if;

  return new;
end;
$$;

-- Trigger on insert and on status update → 'succeeded'
drop trigger if exists trg_orders_create_commissions_insert on public.orders;
create trigger trg_orders_create_commissions_insert
after insert on public.orders
for each row execute procedure public.create_commissions_for_order();

drop trigger if exists trg_orders_create_commissions_update on public.orders;
create trigger trg_orders_create_commissions_update
after update on public.orders
for each row execute procedure public.create_commissions_for_order();

-- === RPC: attach referral by code at/after signup ===
create or replace function public.attach_referrer_by_code(new_user uuid, code text)
returns void
language plpgsql
security definer
as $$
declare
  referrer uuid;
begin
  select id into referrer from public.profiles where referral_code = upper(code);

  if referrer is null then
    raise notice 'Referral code not found: %', code;
    return;
  end if;

  -- Prevent self-referral
  if referrer = new_user then
    return;
  end if;

  -- Only set if empty
  update public.profiles
  set referred_by = referrer
  where id = new_user
    and referred_by is null;
end;
$$;

-- === RLS Updates ===
alter table public.referral_commissions enable row level security;
alter table public.orders enable row level security;

-- Earner can read their own commissions
drop policy if exists p_comm_read_own on public.referral_commissions;
create policy p_comm_read_own on public.referral_commissions
for select using (earner_user_id = auth.uid() or
                  exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin));

-- Admin can manage commissions
drop policy if exists p_comm_admin_all on public.referral_commissions;
create policy p_comm_admin_all on public.referral_commissions
for all using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin))
with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin));

-- Order visibility: owner or admin
drop policy if exists p_orders_read_own on public.orders;
create policy p_orders_read_own on public.orders
for select using (user_id = auth.uid() or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin));

drop policy if exists p_orders_insert_own on public.orders;
create policy p_orders_insert_own on public.orders
for insert with check (user_id = auth.uid() or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin));

drop policy if exists p_orders_update_own on public.orders;
create policy p_orders_update_own on public.orders
for update using (user_id = auth.uid() or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin));

-- === Admin helpers ===
-- Mark a commission as paid (admin only via RLS)
create or replace function public.mark_commission_paid(commission_id uuid)
returns void
language sql
security definer
as $$
  update public.referral_commissions
  set status = 'paid', paid_at = now()
  where id = commission_id and status = 'pending';
$$;

-- Void a commission (refunds, fraud, etc.)
create or replace function public.void_commission(commission_id uuid, reason text default null)
returns void
language sql
security definer
as $$
  update public.referral_commissions
  set status = 'void', notes = coalesce(notes,'') || case when reason is null then '' else ' | '||reason end
  where id = commission_id and status in ('pending');
$$;