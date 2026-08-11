-- ============ CATALOG (public-read, admin-write) ============
create or replace function public.is_super()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super');
$$;

create table public.towers (
  id text primary key,
  name_en text not null, name_ar text not null,
  tier_en text, tier_ar text, sub_en text, sub_ar text,
  price_label_en text, price_label_ar text,
  image text, units_total int not null default 0, units_available int not null default 0, sort int not null default 0
);

create table public.offices (
  id text primary key,
  tower_id text not null references public.towers(id) on delete cascade,
  unit_no text not null, size_m2 int,
  monthly_rent numeric(10,3),           -- KWD, server-side price source for rent
  tenant_name text,
  status text not null default 'available' check (status in ('available','rented')),
  sort int not null default 0
);

create table public.services (
  code text primary key,
  kind text not null check (kind in ('package','event','consult','rent','deposit')),
  category text,
  name_en text not null, name_ar text not null,
  price_kwd numeric(10,3) not null,     -- the ONLY trusted amount; never from the frontend
  features_en jsonb default '[]'::jsonb, features_ar jsonb default '[]'::jsonb,
  meta jsonb default '{}'::jsonb, active boolean not null default true, sort int not null default 0
);

create table public.experts (
  id text primary key,
  initials text, name_en text, name_ar text, role_en text, role_ar text,
  bio_en text, bio_ar text, skills_en jsonb, skills_ar jsonb,
  price_kwd numeric(10,3), duration_min int, avatar text, sort int default 0
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  day text, month_en text, month_ar text, title_en text, title_ar text, sub_en text, sub_ar text,
  price_kwd numeric(10,3), price_label_en text, price_label_ar text, image text, sort int default 0
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  name_en text, name_ar text, cat_en text, cat_ar text,
  perk_en text, perk_ar text, discount text, image text, sort int default 0
);

alter table public.towers enable row level security;
alter table public.offices enable row level security;
alter table public.services enable row level security;
alter table public.experts enable row level security;
alter table public.events enable row level security;
alter table public.offers enable row level security;

create policy "towers_read"  on public.towers  for select using (auth.role() = 'authenticated');
create policy "offices_read" on public.offices for select using (auth.role() = 'authenticated');
create policy "services_read" on public.services for select using (auth.role() = 'authenticated' and active);
create policy "experts_read" on public.experts for select using (auth.role() = 'authenticated');
create policy "events_read"  on public.events  for select using (auth.role() = 'authenticated');
create policy "offers_read"  on public.offers  for select using (auth.role() = 'authenticated');

create policy "towers_write"  on public.towers  for all using (public.is_super()) with check (public.is_super());
create policy "offices_write" on public.offices for all using (public.is_super()) with check (public.is_super());
create policy "services_write" on public.services for all using (public.is_super()) with check (public.is_super());
create policy "experts_write" on public.experts for all using (public.is_super()) with check (public.is_super());
create policy "events_write"  on public.events  for all using (public.is_super()) with check (public.is_super());
create policy "offers_write"  on public.offers  for all using (public.is_super()) with check (public.is_super());
