-- Customer support tickets. Apply in the customer's Supabase SQL editor.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 160),
  message text not null check (char_length(message) between 10 and 5000),
  category text not null default 'general' check (category in ('general', 'account', 'funding', 'verification')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  staff_note text,
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_client_id_idx
  on public.support_tickets(client_id, created_at desc);
create index if not exists support_tickets_status_idx
  on public.support_tickets(status, created_at desc);

alter table public.support_tickets enable row level security;

create policy "clients read own support tickets"
  on public.support_tickets for select to authenticated
  using (client_id = (select auth.uid()));

create policy "clients create own support tickets"
  on public.support_tickets for insert to authenticated
  with check (client_id = (select auth.uid()) and status = 'open');

create policy "staff manage support tickets"
  on public.support_tickets for all to authenticated
  using ((select app_private.is_staff()))
  with check ((select app_private.is_staff()));

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_events'
      and policyname = 'staff insert audit events'
  ) then
    create policy "staff insert audit events"
      on public.audit_events for insert to authenticated
      with check ((select app_private.is_staff()));
  end if;
end $$;
