-- Staff-only bulk revaluation for recorded client holdings.
-- This updates dashboard valuations only; it does not execute trades, transfers, or payments.

create or replace function public.apply_portfolio_revaluation(change_percent numeric)
returns integer
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  changed_count integer;
begin
  if not app_private.is_staff() then
    raise exception 'Not authorised to revalue portfolios';
  end if;

  if change_percent < -100 or change_percent > 1000 then
    raise exception 'Percentage change must be between -100 and 1000';
  end if;

  update public.holdings
  set unit_price = round(unit_price * (1 + (change_percent / 100)), 10),
      valued_at = now();

  get diagnostics changed_count = row_count;

  insert into public.audit_events (actor_id, entity_type, event_type, metadata)
  values (
    auth.uid(),
    'portfolio',
    'bulk_revaluation_applied',
    jsonb_build_object('change_percent', change_percent, 'holdings_updated', changed_count)
  );

  return changed_count;
end;
$$;

grant execute on function public.apply_portfolio_revaluation(numeric) to authenticated;
