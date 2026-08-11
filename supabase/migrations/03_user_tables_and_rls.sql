-- ============ USER-SCOPED DATA (row isolation via user_id) ============
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tower_id text not null references public.towers(id),
  name text not null, phone text not null, created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;
create policy "waitlist_insert_own" on public.waitlist for insert with check (auth.uid() = user_id);
create policy "waitlist_select_own" on public.waitlist for select using (auth.uid() = user_id);
create policy "waitlist_select_admin" on public.waitlist for select using (public.is_admin());
create policy "waitlist_delete_own" on public.waitlist for delete using (auth.uid() = user_id);

create table public.lease_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  office_id text references public.offices(id), tower_id text references public.towers(id),
  unit_no text, term_months int, monthly_rent numeric(10,3), deposit numeric(10,3), total numeric(10,3),
  civil_id_attached boolean not null default false,
  status text not null default 'requested' check (status in ('requested','contacted','contracted','declined')),
  created_at timestamptz not null default now()
);
alter table public.lease_requests enable row level security;
create policy "lease_insert_own" on public.lease_requests for insert with check (auth.uid() = user_id);
create policy "lease_select_own" on public.lease_requests for select using (auth.uid() = user_id);
create policy "lease_select_admin" on public.lease_requests for select using (public.is_admin());

-- Bookings: the payable order. payment_status is the state machine.
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('rent','package','event','consult')),
  service_code text references public.services(code),   -- price source for package/event/consult
  office_id text references public.offices(id),         -- price source for rent
  label text, amount_kwd numeric(10,3),                 -- amount filled by edge fn, never trusted from client
  currency text not null default 'KWD', status text not null default 'draft' check (status in ('draft','requested','cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','awaiting_payment','paid','failed','expired','refunded')),
  provider text, provider_invoice_id text, payment_url text, reference text, paid_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
create policy "bookings_select_own" on public.bookings for select using (auth.uid() = user_id);
create policy "bookings_select_admin" on public.bookings for select using (public.is_admin());
create policy "bookings_insert_own" on public.bookings
  for insert with check (auth.uid() = user_id and payment_status = 'pending');
create policy "bookings_delete_own" on public.bookings
  for delete using (auth.uid() = user_id and payment_status in ('pending','awaiting_payment'));
-- NOTE: no UPDATE policy for app roles. Only the service role (edge functions) can update
-- a booking. See migration 08 for the additional table-level UPDATE revoke.

create index bookings_user_idx on public.bookings(user_id);
create index bookings_reference_idx on public.bookings(reference);
create index bookings_invoice_idx on public.bookings(provider_invoice_id);
create index bookings_expire_idx on public.bookings(payment_status, created_at);

-- Audit log (written only by edge functions / service role)
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  old_status text, new_status text, source text, detail jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.payment_events enable row level security;
create policy "payment_events_select_own" on public.payment_events
  for select using (exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()));
create policy "payment_events_select_admin" on public.payment_events for select using (public.is_admin());

create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  created_at timestamptz not null default now(), unique (user_id, event_id)
);
alter table public.event_rsvps enable row level security;
create policy "rsvp_insert_own" on public.event_rsvps for insert with check (auth.uid() = user_id);
create policy "rsvp_select_own" on public.event_rsvps for select using (auth.uid() = user_id);
create policy "rsvp_select_admin" on public.event_rsvps for select using (public.is_admin());
create policy "rsvp_delete_own" on public.event_rsvps for delete using (auth.uid() = user_id);

create table public.fundme_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  business_name text, sector text, amount_kwd numeric(12,3),
  stage text not null default 'submitted' check (stage in ('submitted','review','analysis','decision')),
  created_at timestamptz not null default now()
);
alter table public.fundme_applications enable row level security;
create policy "fundme_insert_own" on public.fundme_applications for insert with check (auth.uid() = user_id);
create policy "fundme_select_own" on public.fundme_applications for select using (auth.uid() = user_id);
create policy "fundme_select_admin" on public.fundme_applications for select using (public.is_admin());

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();
