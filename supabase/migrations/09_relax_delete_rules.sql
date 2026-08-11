-- Make properties/offices safely removable by super admins.
-- Removing a tower removes its waitlist entries (cascade); lease requests and bookings
-- keep their history but detach the reference (set null). Offices already cascade from tower.

alter table public.waitlist drop constraint waitlist_tower_id_fkey;
alter table public.waitlist add constraint waitlist_tower_id_fkey
  foreign key (tower_id) references public.towers(id) on delete cascade;

alter table public.lease_requests drop constraint lease_requests_tower_id_fkey;
alter table public.lease_requests add constraint lease_requests_tower_id_fkey
  foreign key (tower_id) references public.towers(id) on delete set null;

alter table public.lease_requests drop constraint lease_requests_office_id_fkey;
alter table public.lease_requests add constraint lease_requests_office_id_fkey
  foreign key (office_id) references public.offices(id) on delete set null;

alter table public.bookings drop constraint bookings_office_id_fkey;
alter table public.bookings add constraint bookings_office_id_fkey
  foreign key (office_id) references public.offices(id) on delete set null;