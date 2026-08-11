-- Profiles: one row per auth user. Holds identity + app role.
create type public.app_role as enum ('member', 'staff', 'super');
create type public.member_type as enum ('business_owner', 'freelancer', 'starting');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  phone text,
  member_type public.member_type,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- SECURITY DEFINER helper avoids recursive RLS on profiles.
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('staff','super'));
$$;

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

-- Users can never escalate their own role.
revoke update (role) on public.profiles from anon, authenticated;

-- Auto-create a profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, member_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    (nullif(new.raw_user_meta_data->>'member_type',''))::public.member_type
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
