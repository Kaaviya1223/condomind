create function public.is_building_manager(p_building_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.building_managers bm
    where bm.building_id = p_building_id
      and bm.user_id = (select auth.uid())
  );
$$;

create function public.is_unit_manager(p_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.units u
    join public.building_managers bm on bm.building_id = u.building_id
    where u.id = p_unit_id
      and bm.user_id = (select auth.uid())
  );
$$;

create function public.is_any_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.building_managers bm
    where bm.user_id = (select auth.uid())
  );
$$;

create function public.is_unit_resident(p_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.owners o
    where o.unit_id = p_unit_id and o.user_id = (select auth.uid())
  ) or exists (
    select 1 from public.tenants t
    where t.unit_id = p_unit_id and t.user_id = (select auth.uid())
  );
$$;

create function public.is_building_resident(p_building_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.units u
    where u.building_id = p_building_id
      and public.is_unit_resident(u.id)
  );
$$;

create function public.shares_building_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.building_managers mine
    join public.building_managers theirs on theirs.building_id = mine.building_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = p_user_id
  );
$$;

revoke execute on function public.is_building_manager(uuid) from public, anon;
revoke execute on function public.is_unit_manager(uuid) from public, anon;
revoke execute on function public.is_any_manager() from public, anon;
revoke execute on function public.is_unit_resident(uuid) from public, anon;
revoke execute on function public.is_building_resident(uuid) from public, anon;
revoke execute on function public.shares_building_with(uuid) from public, anon;
grant execute on function public.is_building_manager(uuid) to authenticated;
grant execute on function public.is_unit_manager(uuid) to authenticated;
grant execute on function public.is_any_manager() to authenticated;
grant execute on function public.is_unit_resident(uuid) to authenticated;
grant execute on function public.is_building_resident(uuid) to authenticated;
grant execute on function public.shares_building_with(uuid) to authenticated;

alter table public.buildings enable row level security;
alter table public.units enable row level security;
alter table public.owners enable row level security;
alter table public.tenants enable row level security;
alter table public.vendors enable row level security;
alter table public.maintenance_requests enable row level security;

-- profiles: own row, plus co-managers of the same building
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_building_with(id));

-- building_managers: written only through manager functions
create policy "building_managers_select" on public.building_managers
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_building_manager(building_id));

-- buildings: created only through create_building()
create policy "buildings_select" on public.buildings
  for select to authenticated
  using (public.is_building_manager(id) or public.is_building_resident(id));

create policy "buildings_update" on public.buildings
  for update to authenticated
  using (public.is_building_manager(id))
  with check (public.is_building_manager(id));

create policy "buildings_delete" on public.buildings
  for delete to authenticated
  using (public.is_building_manager(id));

-- units
create policy "units_select" on public.units
  for select to authenticated
  using (public.is_building_manager(building_id) or public.is_unit_resident(id));

create policy "units_insert" on public.units
  for insert to authenticated
  with check (public.is_building_manager(building_id));

create policy "units_update" on public.units
  for update to authenticated
  using (public.is_building_manager(building_id))
  with check (public.is_building_manager(building_id));

create policy "units_delete" on public.units
  for delete to authenticated
  using (public.is_building_manager(building_id));

-- owners
create policy "owners_select" on public.owners
  for select to authenticated
  using (public.is_unit_manager(unit_id) or user_id = (select auth.uid()));

create policy "owners_insert" on public.owners
  for insert to authenticated
  with check (public.is_unit_manager(unit_id));

create policy "owners_update" on public.owners
  for update to authenticated
  using (public.is_unit_manager(unit_id))
  with check (public.is_unit_manager(unit_id));

create policy "owners_delete" on public.owners
  for delete to authenticated
  using (public.is_unit_manager(unit_id));

-- tenants
create policy "tenants_select" on public.tenants
  for select to authenticated
  using (public.is_unit_manager(unit_id) or user_id = (select auth.uid()));

create policy "tenants_insert" on public.tenants
  for insert to authenticated
  with check (public.is_unit_manager(unit_id));

create policy "tenants_update" on public.tenants
  for update to authenticated
  using (public.is_unit_manager(unit_id))
  with check (public.is_unit_manager(unit_id));

create policy "tenants_delete" on public.tenants
  for delete to authenticated
  using (public.is_unit_manager(unit_id));

-- vendors: read-only to managers; maintained in the dashboard
create policy "vendors_select" on public.vendors
  for select to authenticated
  using (public.is_any_manager());

-- maintenance_requests: residents submit, managers update
create policy "maintenance_requests_select" on public.maintenance_requests
  for select to authenticated
  using (
    public.is_unit_manager(unit_id)
    or public.is_unit_resident(unit_id)
    or submitted_by = (select auth.uid())
  );

create policy "maintenance_requests_insert" on public.maintenance_requests
  for insert to authenticated
  with check (
    public.is_unit_resident(unit_id)
    and submitted_by = (select auth.uid())
  );

create policy "maintenance_requests_update" on public.maintenance_requests
  for update to authenticated
  using (public.is_unit_manager(unit_id))
  with check (public.is_unit_manager(unit_id));
