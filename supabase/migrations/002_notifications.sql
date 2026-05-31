create table public.notifications (
  id         uuid        default uuid_generate_v4() primary key,
  user_id    uuid        references public.profiles(id) on delete cascade not null,
  message    text        not null,
  link       text,
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update to authenticated using (user_id = auth.uid());
