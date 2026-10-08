create type public.user_role as enum ('manager', 'owner', 'tenant');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'tenant',
  full_name text,
  created_at timestamptz not null default now()
);

create table public.building_managers (
  user_id uuid not null references public.profiles (id) on delete cascade,
  building_id uuid not null references public.buildings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, building_id)
);

alter table public.owners
  add column user_id uuid references auth.users (id) on delete set null;

alter table public.tenants
  add column user_id uuid references auth.users (id) on delete set null;

alter table public.maintenance_requests
  add column submitted_by uuid references auth.users (id) on delete set null;

create index building_managers_building_id_idx
  on public.building_managers (building_id);

create index owners_user_id_idx
  on public.owners (user_id);

create index tenants_user_id_idx
  on public.tenants (user_id);

create index maintenance_requests_submitted_by_idx
  on public.maintenance_requests (submitted_by);

alter table public.profiles enable row level security;
alter table public.building_managers enable row level security;
