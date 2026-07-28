-- ===== Roles =====
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

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

create policy "Users can view own profile" on public.profiles
  for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users can update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Users can view own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- ===== Vehicles =====
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  category text not null,
  year int not null default extract(year from now())::int,
  price numeric(12,2) not null check (price >= 0),
  quantity int not null default 0 check (quantity >= 0),
  description text,
  image_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.vehicles to anon;
grant select, insert, update, delete on public.vehicles to authenticated;
grant all on public.vehicles to service_role;
alter table public.vehicles enable row level security;

create policy "Anyone can view vehicles" on public.vehicles for select using (true);
create policy "Authenticated can add vehicles" on public.vehicles
  for insert to authenticated with check (auth.uid() is not null);
create policy "Authenticated can update vehicles" on public.vehicles
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins can delete vehicles" on public.vehicles
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create index vehicles_make_idx on public.vehicles (lower(make));
create index vehicles_model_idx on public.vehicles (lower(model));
create index vehicles_category_idx on public.vehicles (lower(category));
create index vehicles_price_idx on public.vehicles (price);

-- ===== Purchases =====
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.purchases to authenticated;
grant all on public.purchases to service_role;
alter table public.purchases enable row level security;

create policy "Users can view own purchases" on public.purchases
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users can create own purchases" on public.purchases
  for insert to authenticated with check (user_id = auth.uid());

-- ===== Shared triggers =====
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

create trigger vehicles_set_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ===== Signup handling: profile + role (first user becomes admin) =====
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Inventory operations (atomic, security definer) =====
create or replace function public.purchase_vehicle(_vehicle_id uuid, _quantity int default 1)
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

create or replace function public.restock_vehicle(_vehicle_id uuid, _quantity int default 1)
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

grant execute on function public.purchase_vehicle(uuid, int) to authenticated;
grant execute on function public.restock_vehicle(uuid, int) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon;

-- ===== Demo inventory =====
insert into public.vehicles (make, model, category, year, price, quantity, description) values
('Toyota','Corolla Hybrid','Sedan',2024,28500.00,6,'Efficient hybrid commuter with a legendary reliability record.'),
('Honda','CR-V','SUV',2024,36900.00,4,'Family-ready SUV with generous cargo space and safety tech.'),
('Ford','F-150 Lariat','Truck',2023,58900.00,3,'Best-selling pickup with towing muscle and a premium cabin.'),
('Tesla','Model 3 Long Range','Electric',2025,47990.00,5,'Dual-motor EV with 500km range and autopilot hardware.'),
('BMW','M4 Competition','Coupe',2024,94500.00,2,'Twin-turbo inline-six performance coupe, 503 hp.'),
('Mazda','CX-5 Signature','SUV',2024,41200.00,0,'Premium compact SUV with an interior above its class.'),
('Volkswagen','Golf GTI','Hatchback',2023,34200.00,4,'The original hot hatch, still the benchmark.'),
('Mercedes-Benz','E 350','Sedan',2025,72300.00,1,'Executive sedan with adaptive suspension and MBUX.');