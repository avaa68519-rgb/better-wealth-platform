-- Better Wealth Investment Group: initial platform schema
-- Apply this migration only in the customer's Supabase project.
-- This database stores request records and public wallet addresses only.
-- It must never store private keys, seed phrases, exchange credentials, or payout credentials.

create extension if not exists pgcrypto;
create schema if not exists app_private;

do $$ begin
  create type public.app_role as enum ('client', 'super_admin', 'compliance', 'operations', 'support');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.review_status as enum ('not_started', 'pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('submitted', 'under_review', 'approved', 'rejected', 'credited', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'client',
  first_name text,
  last_name text,
  phone_number text,
  country_code text,
  investment_plan text,
  identity_status public.review_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('passport', 'drivers_license', 'national_id')),
  document_path text not null,
  selfie_path text not null,
  status public.review_status not null default 'pending',
  reviewer_id uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  submitted_at timestamptz not null default now()
);

create table if not exists public.portfolio_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  currency_code text not null default 'USD',
  status text not null default 'active' check (status in ('active', 'closed', 'suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_account_id uuid not null references public.portfolio_accounts(id) on delete cascade,
  asset_name text not null,
  asset_symbol text not null,
  asset_class text not null,
  units numeric(28, 10) not null check (units >= 0),
  unit_price numeric(28, 10) not null check (unit_price >= 0),
  valuation_currency text not null default 'USD',
  valued_at timestamptz not null default now(),
  unique (portfolio_account_id, asset_symbol)
);

create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  storage_path text not null unique,
  document_type text not null check (document_type in ('statement', 'agreement', 'notice', 'tax_document')),
  available_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

create table if not exists public.deposit_addresses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  asset_symbol text not null,
  network text not null,
  public_address text not null,
  is_active boolean not null default true,
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  retired_at timestamptz,
  unique (client_id, asset_symbol, network, is_active)
);

create table if not exists public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  deposit_address_id uuid references public.deposit_addresses(id),
  asset_symbol text not null,
  network text not null,
  declared_amount numeric(28, 10) not null check (declared_amount > 0),
  transaction_reference text not null,
  status public.request_status not null default 'submitted',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  internal_note text,
  submitted_at timestamptz not null default now(),
  unique (network, transaction_reference)
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  asset_symbol text not null,
  network text not null,
  requested_amount numeric(28, 10) not null check (requested_amount > 0),
  destination_address text not null,
  status public.request_status not null default 'submitted',
  payout_reference text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  internal_note text,
  submitted_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists portfolio_accounts_client_id_idx on public.portfolio_accounts(client_id);
create index if not exists holdings_account_id_idx on public.holdings(portfolio_account_id);
create index if not exists client_documents_client_id_idx on public.client_documents(client_id);
create index if not exists deposit_addresses_client_id_idx on public.deposit_addresses(client_id);
create index if not exists deposit_requests_client_id_idx on public.deposit_requests(client_id);
create index if not exists withdrawal_requests_client_id_idx on public.withdrawal_requests(client_id);
create index if not exists audit_events_entity_idx on public.audit_events(entity_type, entity_id, occurred_at desc);

create or replace function app_private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('super_admin', 'compliance', 'operations', 'support')
  );
$$;

create or replace function app_private.can_request_withdrawal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and identity_status = 'approved'
  );
$$;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_staff() to authenticated;
grant execute on function app_private.can_request_withdrawal() to authenticated;

alter table public.profiles enable row level security;
alter table public.identity_verifications enable row level security;
alter table public.portfolio_accounts enable row level security;
alter table public.holdings enable row level security;
alter table public.client_documents enable row level security;
alter table public.deposit_addresses enable row level security;
alter table public.deposit_requests enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.audit_events enable row level security;

create policy "clients read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "staff read profiles" on public.profiles for select to authenticated using ((select app_private.is_staff()));
create policy "staff update profiles" on public.profiles for update to authenticated using ((select app_private.is_staff())) with check ((select app_private.is_staff()));

create policy "clients read own verification" on public.identity_verifications for select to authenticated using (client_id = (select auth.uid()));
create policy "clients submit verification" on public.identity_verifications for insert to authenticated with check (client_id = (select auth.uid()) and status = 'pending');
create policy "staff manage verification" on public.identity_verifications for all to authenticated using ((select app_private.is_staff())) with check ((select app_private.is_staff()));

create policy "clients read own accounts" on public.portfolio_accounts for select to authenticated using (client_id = (select auth.uid()));
create policy "staff manage accounts" on public.portfolio_accounts for all to authenticated using ((select app_private.is_staff())) with check ((select app_private.is_staff()));
create policy "clients read own holdings" on public.holdings for select to authenticated using (portfolio_account_id in (select id from public.portfolio_accounts where client_id = (select auth.uid())));
create policy "staff manage holdings" on public.holdings for all to authenticated using ((select app_private.is_staff())) with check ((select app_private.is_staff()));
create policy "clients read own documents" on public.client_documents for select to authenticated using (client_id = (select auth.uid()));
create policy "staff manage documents" on public.client_documents for all to authenticated using ((select app_private.is_staff())) with check ((select app_private.is_staff()));

create policy "clients read active assigned deposit addresses" on public.deposit_addresses for select to authenticated using (client_id = (select auth.uid()) and is_active);
create policy "staff manage deposit addresses" on public.deposit_addresses for all to authenticated using ((select app_private.is_staff())) with check ((select app_private.is_staff()));
create policy "clients read own deposits" on public.deposit_requests for select to authenticated using (client_id = (select auth.uid()));
create policy "clients submit deposits" on public.deposit_requests for insert to authenticated with check (client_id = (select auth.uid()) and status = 'submitted');
create policy "staff manage deposits" on public.deposit_requests for all to authenticated using ((select app_private.is_staff())) with check ((select app_private.is_staff()));
create policy "clients read own withdrawals" on public.withdrawal_requests for select to authenticated using (client_id = (select auth.uid()));
create policy "verified clients submit withdrawals" on public.withdrawal_requests for insert to authenticated with check (client_id = (select auth.uid()) and status = 'submitted' and (select app_private.can_request_withdrawal()));
create policy "staff manage withdrawals" on public.withdrawal_requests for all to authenticated using ((select app_private.is_staff())) with check ((select app_private.is_staff()));
create policy "staff read audit events" on public.audit_events for select to authenticated using ((select app_private.is_staff()));

-- Private KYC files. Clients can submit and retrieve only their own user-ID folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyc-documents', 'kyc-documents', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "clients upload own KYC files" on storage.objects for insert to authenticated
with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "clients read own KYC files" on storage.objects for select to authenticated
using (bucket_id = 'kyc-documents' and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select app_private.is_staff())));

-- Create the client profile only. Staff roles are assigned manually in the Supabase dashboard after identity checks.
create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone_number, country_code, investment_plan)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone_number',
    new.raw_user_meta_data ->> 'country_code',
    new.raw_user_meta_data ->> 'investment_plan'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure app_private.handle_new_user();
