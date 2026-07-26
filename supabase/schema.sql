-- =====================================================================
-- Torque Motors — Car Dealership Inventory System
-- Full database schema for a self-hosted / own Supabase project.
--
-- HOW TO RUN (manual, one time):
--   1. Open your Supabase project -> SQL Editor -> New query
--   2. Paste this entire file and press "Run"
--   3. Auth -> Providers -> Email: enable "Confirm email" = OFF for local
--      testing (otherwise the first login needs an email confirmation)
--
-- The FIRST user who registers is automatically promoted to admin.
-- Safe to re-run: every statement is idempotent.
-- =====================================================================

-- ---------- 1. Roles enum -------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'user');
  end if;
end
$$;

-- ---------- 2. Tables -----------------------------------------------------

-- Profiles: user-facing account data (never store roles here).
create table if not exists public.profiles (
  id uuid primary key,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- Roles live in their own table to prevent privilege escalation.
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- Inventory. Created only if absent; an existing table is migrated in place
-- below so pre-existing rows (and extra columns such as `color`) survive.
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  category text not null,
  year integer not null default (extract(year from now()))::int,
  price numeric not null,
  quantity integer not null default 0,
  description text,
  image_url text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bring an older/foreign `vehicles` table up to the shape the app expects.
alter table public.vehicles add column if not exists description text;
alter table public.vehicles add column if not exists image_url text;
alter table public.vehicles add column if not exists created_by uuid;
alter table public.vehicles add column if not exists year integer
  default (extract(year from now()))::int;
alter table public.vehicles add column if not exists created_at timestamptz not null default now();
alter table public.vehicles add column if not exists updated_at timestamptz not null default now();

-- Any extra columns the app does not write must be nullable, or inserts fail.
do $$
declare c record;
begin
  for c in
    select column_name from information_schema.columns
     where table_schema = 'public' and table_name = 'vehicles'
       and is_nullable = 'NO' and column_default is null
       and column_name not in ('id','make','model','category','price','quantity')
  loop
    execute format('alter table public.vehicles alter column %I drop not null', c.column_name);
  end loop;
end
$$;

grant select on public.vehicles to anon;
grant select, insert, update, delete on public.vehicles to authenticated;
grant all on public.vehicles to service_role;
alter table public.vehicles enable row level security;

-- Purchase ledger.
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null,
  total_price numeric not null,
  created_at timestamptz not null default now()
);

grant select, insert on public.purchases to authenticated;
grant all on public.purchases to service_role;
alter table public.purchases enable row level security;

-- ---------- 3. Role helper (security definer, avoids RLS recursion) -------
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- ---------- 4. RLS policies ----------------------------------------------
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Anyone can view vehicles" on public.vehicles;
create policy "Anyone can view vehicles" on public.vehicles
  for select using (true);

drop policy if exists "Authenticated can add vehicles" on public.vehicles;
drop policy if exists "Admins can add vehicles" on public.vehicles;
create policy "Admins can add vehicles" on public.vehicles
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Authenticated can update vehicles" on public.vehicles;
drop policy if exists "Admins can update vehicles" on public.vehicles;
create policy "Admins can update vehicles" on public.vehicles
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete vehicles" on public.vehicles;
create policy "Admins can delete vehicles" on public.vehicles
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can view own purchases" on public.purchases;
create policy "Users can view own purchases" on public.purchases
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can create own purchases" on public.purchases;
create policy "Users can create own purchases" on public.purchases
  for insert to authenticated with check (user_id = auth.uid());

-- ---------- 5. Timestamp trigger -----------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_vehicles_updated_at on public.vehicles;
create trigger set_vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- 6. Signup handler: profile + first-user-is-admin --------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  select count(*) = 0 into is_first from public.user_roles;

  insert into public.user_roles (user_id, role)
  values (new.id, case when is_first then 'admin'::public.app_role else 'user'::public.app_role end)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 7. Atomic inventory operations --------------------------------
-- Purchase: single UPDATE guarded by `quantity >= _quantity`, so concurrent
-- buyers can never drive stock negative (no read-then-write race).
create or replace function public.purchase_vehicle(_vehicle_id uuid, _quantity integer default 1)
returns public.vehicles
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.vehicles;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized: authentication required';
  end if;
  if _quantity is null or _quantity < 1 then
    raise exception 'Quantity must be at least 1';
  end if;

  update public.vehicles
     set quantity = quantity - _quantity
   where id = _vehicle_id and quantity >= _quantity
  returning * into v;

  if v.id is null then
    raise exception 'Vehicle is out of stock or does not have enough units available';
  end if;

  insert into public.purchases (user_id, vehicle_id, quantity, unit_price, total_price)
  values (auth.uid(), v.id, _quantity, v.price, v.price * _quantity);

  return v;
end;
$$;

-- Restock: admin only, enforced inside the database.
create or replace function public.restock_vehicle(_vehicle_id uuid, _quantity integer default 1)
returns public.vehicles
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.vehicles;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Forbidden: admin role required';
  end if;
  if _quantity is null or _quantity < 1 then
    raise exception 'Quantity must be at least 1';
  end if;

  update public.vehicles set quantity = quantity + _quantity
   where id = _vehicle_id returning * into v;

  if v.id is null then
    raise exception 'Vehicle not found';
  end if;

  return v;
end;
$$;

-- Only signed-in callers may execute the inventory / role functions.
revoke execute on function public.purchase_vehicle(uuid, integer) from anon, public;
revoke execute on function public.restock_vehicle(uuid, integer) from anon, public;
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
grant execute on function public.purchase_vehicle(uuid, integer) to authenticated;
grant execute on function public.restock_vehicle(uuid, integer) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- ---------- 8. Seed inventory --------------------------------------------
insert into public.vehicles (make, model, category, year, price, quantity, description, image_url)
select * from (values
  ('Porsche','911 Carrera S','Sports',2024,134900,3,'Rear-engine icon with a 3.0L twin-turbo flat-six and PDK gearbox.','https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80'),
  ('Tesla','Model S Plaid','Electric',2024,89990,5,'Tri-motor all-wheel drive, 0-60 mph in under two seconds.','https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&q=80'),
  ('Land Rover','Range Rover Sport','SUV',2023,83000,4,'Refined luxury SUV with genuine off-road capability.','https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80'),
  ('BMW','M3 Competition','Sedan',2024,76900,2,'Twin-turbo inline-six sports sedan with adaptive M suspension.','https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80'),
  ('Ford','F-150 Lightning','Truck',2024,62995,6,'All-electric pickup with 4.5 kW onboard power export.','https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=80'),
  ('Toyota','Corolla Hybrid','Hatchback',2024,25900,12,'Efficient daily commuter rated above 50 mpg combined.','https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200&q=80'),
  ('Mercedes-Benz','G 63 AMG','SUV',2023,179000,0,'Hand-built 4.0L V8 biturbo in the legendary G-Wagen body.','https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=1200&q=80'),
  ('Mazda','MX-5 Miata','Convertible',2024,29900,7,'Lightweight rear-wheel-drive roadster, purest driving fun per dollar.','https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80')
) as seed(make, model, category, year, price, quantity, description, image_url)
where not exists (select 1 from public.vehicles);
