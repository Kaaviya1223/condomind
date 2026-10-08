create function public.create_building(p_name text, p_address text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_building_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'manager'
  ) then
    raise exception 'Only managers can create buildings' using errcode = '42501';
  end if;

  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception 'Name and address are required' using errcode = '22023';
  end if;

  insert into public.buildings (name, address)
  values (trim(p_name), trim(p_address))
  returning id into v_building_id;

  insert into public.building_managers (user_id, building_id)
  values ((select auth.uid()), v_building_id);

  return v_building_id;
end;
$$;

create function public.invite_manager(p_email text, p_building_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if not public.is_building_manager(p_building_id) then
    raise exception 'You do not manage this building' using errcode = '42501';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
    and u.email_confirmed_at is not null;

  if v_user_id is null then
    raise exception 'No confirmed account uses that email' using errcode = 'P0002';
  end if;

  update public.profiles set role = 'manager' where id = v_user_id;

  insert into public.building_managers (user_id, building_id)
  values (v_user_id, p_building_id)
  on conflict do nothing;
end;
$$;

create function public.remove_manager(p_user_id uuid, p_building_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_building_manager(p_building_id) then
    raise exception 'You do not manage this building' using errcode = '42501';
  end if;

  if (
    select count(*) from public.building_managers
    where building_id = p_building_id
  ) <= 1 then
    raise exception 'A building must keep at least one manager' using errcode = '23514';
  end if;

  delete from public.building_managers
  where user_id = p_user_id and building_id = p_building_id;
end;
$$;

revoke execute on function public.create_building(text, text) from public, anon;
revoke execute on function public.invite_manager(text, uuid) from public, anon;
revoke execute on function public.remove_manager(uuid, uuid) from public, anon;
grant execute on function public.create_building(text, text) to authenticated;
grant execute on function public.invite_manager(text, uuid) to authenticated;
grant execute on function public.remove_manager(uuid, uuid) to authenticated;

-- Owner and tenant accounts are linked by confirmed email only, never by a
-- user_id sent from the client.
create function public.link_resident_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or trim(new.email) = '' then
    new.user_id := null;
  else
    select u.id into new.user_id
    from auth.users u
    where lower(u.email) = lower(trim(new.email))
      and u.email_confirmed_at is not null;
  end if;

  return new;
end;
$$;

create trigger link_owner_account
  before insert or update on public.owners
  for each row execute function public.link_resident_account();

create trigger link_tenant_account
  before insert or update on public.tenants
  for each row execute function public.link_resident_account();

create function public.promote_linked_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is not null then
    update public.profiles
    set role = 'owner'
    where id = new.user_id
      and role = 'tenant';
  end if;

  return new;
end;
$$;

create trigger promote_linked_owner
  after insert or update of user_id on public.owners
  for each row execute function public.promote_linked_owner();
