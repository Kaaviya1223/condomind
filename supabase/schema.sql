create table public.buildings (
  id uuid not null default gen_random_uuid(),
  name text not null,
  address text not null,
  total_units integer default 0,
  created_at timestamp with time zone default now()
);

create table public.maintenance_requests (
  id uuid not null default gen_random_uuid(),
  unit_id uuid,
  assigned_vendor_id uuid,
  title text not null,
  description text,
  photo_url text,
  category text,
  priority text default 'medium'::text,
  status text default 'open'::text,
  ai_notes text,
  submitted_at timestamp with time zone default now(),
  resolved_at timestamp with time zone
);

create table public.owners (
  id uuid not null default gen_random_uuid(),
  unit_id uuid,
  full_name text not null,
  ic_no text,
  email text,
  phone text,
  created_at timestamp with time zone default now()
);

create table public.tenants (
  id uuid not null default gen_random_uuid(),
  unit_id uuid,
  full_name text not null,
  ic_no text,
  email text,
  phone text,
  lease_start date,
  lease_end date,
  created_at timestamp with time zone default now()
);

create table public.units (
  id uuid not null default gen_random_uuid(),
  building_id uuid,
  unit_no text not null,
  floor_area_sqft double precision,
  share_units double precision default 1.0,
  status text default 'occupied'::text,
  created_at timestamp with time zone default now()
);

create table public.vendors (
  id uuid not null default gen_random_uuid(),
  company_name text not null,
  contact_person text,
  phone text,
  service_type text,
  created_at timestamp with time zone default now()
);

alter table public.buildings add constraint buildings_pkey PRIMARY KEY (id);
alter table public.maintenance_requests add constraint maintenance_requests_pkey PRIMARY KEY (id);
alter table public.owners add constraint owners_pkey PRIMARY KEY (id);
alter table public.tenants add constraint tenants_pkey PRIMARY KEY (id);
alter table public.units add constraint units_pkey PRIMARY KEY (id);
alter table public.vendors add constraint vendors_pkey PRIMARY KEY (id);
alter table public.maintenance_requests add constraint maintenance_requests_assigned_vendor_id_fkey FOREIGN KEY (assigned_vendor_id) REFERENCES vendors(id);
alter table public.maintenance_requests add constraint maintenance_requests_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
alter table public.owners add constraint owners_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
alter table public.tenants add constraint tenants_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
alter table public.units add constraint units_building_id_fkey FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE;
alter table public.maintenance_requests add constraint maintenance_requests_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])));
alter table public.maintenance_requests add constraint maintenance_requests_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])));
alter table public.units add constraint units_status_check CHECK ((status = ANY (ARRAY['occupied'::text, 'vacant'::text, 'under_renovation'::text])));