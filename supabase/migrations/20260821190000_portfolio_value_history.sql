-- Tracks real portfolio valuations for customer performance charts.
create table if not exists public.portfolio_value_history (
  id bigint generated always as identity primary key,
  client_id uuid not null references public.profiles(id) on delete cascade,
  portfolio_value numeric(28, 10) not null check (portfolio_value >= 0),
  recorded_at timestamptz not null default now()
);

create index if not exists portfolio_value_history_client_time_idx
  on public.portfolio_value_history (client_id, recorded_at desc);

alter table public.portfolio_value_history enable row level security;

create policy "clients read own portfolio history" on public.portfolio_value_history
  for select to authenticated using (client_id = (select auth.uid()));
create policy "staff read portfolio history" on public.portfolio_value_history
  for select to authenticated using ((select app_private.is_staff()));

create or replace function app_private.record_portfolio_value_history()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  target_account uuid := coalesce(new.portfolio_account_id, old.portfolio_account_id);
  target_client uuid;
  current_value numeric(28, 10);
begin
  select client_id into target_client from public.portfolio_accounts where id = target_account;
  if target_client is not null then
    select coalesce(sum(h.units * h.unit_price), 0) into current_value
    from public.holdings h
    join public.portfolio_accounts pa on pa.id = h.portfolio_account_id
    where pa.client_id = target_client and pa.status = 'active';
    insert into public.portfolio_value_history (client_id, portfolio_value)
    values (target_client, current_value);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists record_portfolio_value_history on public.holdings;
create trigger record_portfolio_value_history
after insert or update or delete on public.holdings
for each row execute procedure app_private.record_portfolio_value_history();

insert into public.portfolio_value_history (client_id, portfolio_value)
select pa.client_id, coalesce(sum(h.units * h.unit_price), 0)
from public.portfolio_accounts pa
left join public.holdings h on h.portfolio_account_id = pa.id
where pa.status = 'active'
group by pa.client_id;
