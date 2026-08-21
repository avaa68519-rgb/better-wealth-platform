-- Allow authorised Better Wealth staff to record operational actions.
-- Existing client-facing RLS restrictions are unchanged.
drop policy if exists "staff write audit events" on public.audit_events;
create policy "staff write audit events" on public.audit_events
  for insert to authenticated
  with check ((select app_private.is_staff()));
