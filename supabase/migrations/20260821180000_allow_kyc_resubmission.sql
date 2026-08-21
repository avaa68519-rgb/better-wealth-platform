-- Clients may replace a pending or rejected KYC submission with fresh files.
-- Approved KYC remains immutable to clients and can only be changed by authorised staff.

drop policy if exists "clients resubmit own verification" on public.identity_verifications;
create policy "clients resubmit own verification"
  on public.identity_verifications for update to authenticated
  using (client_id = (select auth.uid()) and status in ('pending', 'rejected'))
  with check (client_id = (select auth.uid()) and status = 'pending');
