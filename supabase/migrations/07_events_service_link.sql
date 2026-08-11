-- Link paid events to their priced service (so ticket price comes from the DB).
alter table public.events add column service_code text references public.services(code);
update public.events set service_code = 'evt-pricing' where title_en like 'Workshop%';
update public.events set service_code = 'evt-tenders' where title_en like 'Seminar%';
