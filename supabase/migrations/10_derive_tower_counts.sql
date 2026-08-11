-- Tower occupancy is DERIVED from the actual office rows — no manual counts.
-- Any add/remove/status-change of an office recomputes its tower's totals, so the
-- member "spaces" list and each property page always reflect reality.
create or replace function public.sync_tower_counts()
returns trigger language plpgsql security definer set search_path = public as $$
declare tid text;
begin
  tid := case when tg_op = 'DELETE' then old.tower_id else new.tower_id end;

  update public.towers t set
    units_total     = (select count(*) from public.offices o where o.tower_id = t.id),
    units_available = (select count(*) from public.offices o where o.tower_id = t.id and o.status = 'available')
  where t.id = tid;

  -- If an office was moved to a different tower, refresh the old tower too.
  if tg_op = 'UPDATE' and new.tower_id is distinct from old.tower_id then
    update public.towers t set
      units_total     = (select count(*) from public.offices o where o.tower_id = t.id),
      units_available = (select count(*) from public.offices o where o.tower_id = t.id and o.status = 'available')
    where t.id = old.tower_id;
  end if;

  return null;
end; $$;

create trigger offices_sync_counts
after insert or update or delete on public.offices
for each row execute function public.sync_tower_counts();

-- Backfill every tower from its current offices.
update public.towers t set
  units_total     = (select count(*) from public.offices o where o.tower_id = t.id),
  units_available = (select count(*) from public.offices o where o.tower_id = t.id and o.status = 'available');
