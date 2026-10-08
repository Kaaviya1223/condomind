create function public.guard_maintenance_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.submitted_by := (select auth.uid());
    new.submitted_at := now();
    new.status := 'open';
    new.resolved_at := null;

    if not public.is_unit_manager(new.unit_id) then
      new.priority := 'medium';
      new.category := null;
      new.ai_notes := null;
      new.assigned_vendor_id := null;
      new.photo_url := null;
    end if;

    return new;
  end if;

  new.unit_id := old.unit_id;
  new.submitted_by := old.submitted_by;
  new.submitted_at := old.submitted_at;

  if new.status in ('resolved', 'closed') then
    if old.status not in ('resolved', 'closed') or old.resolved_at is null then
      new.resolved_at := now();
    else
      new.resolved_at := old.resolved_at;
    end if;
  else
    new.resolved_at := null;
  end if;

  return new;
end;
$$;

create trigger guard_maintenance_request
  before insert or update on public.maintenance_requests
  for each row execute function public.guard_maintenance_request();
