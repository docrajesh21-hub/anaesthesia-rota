-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type public.session_type as enum ('theatre', 'oncall', 'icu', 'clinic', 'other');
create type public.session_status as enum ('pending', 'confirmed', 'cancelled');
create type public.leave_type as enum ('annual', 'study', 'sick', 'other');
create type public.leave_status as enum ('pending', 'approved', 'rejected');

-- ─── Tables ───────────────────────────────────────────────────────────────────

-- Extends auth.users with partner-specific fields
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text        not null,
  grade       text        not null default 'consultant',
  colour      text        not null default '#6366f1', -- partner display colour on rota
  role        text        not null default 'partner' check (role in ('admin', 'partner')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- A schedulable block of work (theatre list, on-call, ICU, etc.)
-- status drives colour: pending=yellow, confirmed=green, cancelled=red
create table public.sessions (
  id          uuid        default uuid_generate_v4() primary key,
  date        date        not null,
  title       text        not null,
  type        public.session_type   not null default 'theatre',
  status      public.session_status not null default 'pending',
  start_time  time,
  end_time    time,
  notes       text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Links a partner to a session on the rota
create table public.rota_assignments (
  id          uuid default uuid_generate_v4() primary key,
  session_id  uuid references public.sessions(id)  on delete cascade not null,
  profile_id  uuid references public.profiles(id)  on delete cascade not null,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique (session_id, profile_id)
);

-- Partner leave requests (displayed in blue on the rota)
create table public.leave_requests (
  id          uuid default uuid_generate_v4() primary key,
  profile_id  uuid references public.profiles(id) on delete cascade not null,
  start_date  date        not null,
  end_date    date        not null,
  type        public.leave_type   not null default 'annual',
  status      public.leave_status not null default 'pending',
  notes       text,
  reviewed_by uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles        enable row level security;
alter table public.sessions        enable row level security;
alter table public.rota_assignments enable row level security;
alter table public.leave_requests  enable row level security;

-- profiles: all authenticated users can read; own row update only
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- sessions: all authenticated can read; admins can write
create policy "sessions_select" on public.sessions
  for select to authenticated using (true);

create policy "sessions_insert_admin" on public.sessions
  for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "sessions_update_admin" on public.sessions
  for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "sessions_delete_admin" on public.sessions
  for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- rota_assignments: all can read; admins can write
create policy "assignments_select" on public.rota_assignments
  for select to authenticated using (true);

create policy "assignments_all_admin" on public.rota_assignments
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- leave_requests: own rows + admins can read; partners insert/update own pending
create policy "leave_select" on public.leave_requests
  for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "leave_insert_own" on public.leave_requests
  for insert to authenticated
  with check (profile_id = auth.uid());

create policy "leave_update" on public.leave_requests
  for update to authenticated
  using (
    (profile_id = auth.uid() and status = 'pending')
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ─── Trigger: auto-create profile on signup ───────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'partner')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
