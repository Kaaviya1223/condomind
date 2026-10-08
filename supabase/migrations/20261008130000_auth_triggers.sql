create function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_owner boolean;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  if new.email_confirmed_at is null or new.email is null then
    return new;
  end if;

  update public.owners
  set user_id = new.id
  where user_id is null
    and lower(email) = lower(new.email);
  is_owner := found;

  update public.tenants
  set user_id = new.id
  where user_id is null
    and lower(email) = lower(new.email);

  if is_owner then
    update public.profiles
    set role = 'owner'
    where id = new.id
      and role = 'tenant';
  end if;

  return new;
end;
$$;

create trigger on_auth_user_change
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.handle_auth_user();
