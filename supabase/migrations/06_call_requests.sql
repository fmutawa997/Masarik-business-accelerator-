-- "Give me a call" lead form (user-scoped, admins read all).
create table public.call_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text, phone text, topic text, created_at timestamptz not null default now()
);
alter table public.call_requests enable row level security;
create policy "call_insert_own" on public.call_requests for insert with check (auth.uid() = user_id);
create policy "call_select_own" on public.call_requests for select using (auth.uid() = user_id);
create policy "call_select_admin" on public.call_requests for select using (public.is_admin());
