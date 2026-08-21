-- Adds the staff-managed percentage shown alongside each client holding.
-- This is a reporting value entered by authorised staff; it does not execute trades or calculate tax.

alter table public.holdings
  add column if not exists performance_percent numeric(10, 4) not null default 0
  check (performance_percent >= -100);
