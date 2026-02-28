create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('free_trial', 'active', 'past_due', 'canceled');
  end if;

  if not exists (select 1 from pg_type where typname = 'session_type') then
    create type public.session_type as enum ('morning', 'afternoon', 'night');
  end if;

  if not exists (select 1 from pg_type where typname = 'sync_status') then
    create type public.sync_status as enum ('pending', 'synced', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type public.submission_status as enum ('pending', 'ocr_success', 'needs_admin', 'rejected', 'approved');
  end if;

  if not exists (select 1 from pg_type where typname = 'digest_type') then
    create type public.digest_type as enum ('timetable_changed', 'visit_reminder', 'system');
  end if;
end
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  is_onboarded boolean not null default false,
  gcal_calendar_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text,
  created_at timestamptz not null default now()
);

create table if not exists public.doctor_affiliations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  department text not null,
  created_at timestamptz not null default now(),
  unique (doctor_id, hospital_id, department)
);

create table if not exists public.timetables (
  id uuid primary key default gen_random_uuid(),
  affiliation_id uuid not null references public.doctor_affiliations(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  session_type public.session_type not null,
  start_time time not null,
  end_time time not null,
  valid_from date not null,
  valid_until date,
  status text not null default 'active',
  last_verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.target_doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  private_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, doctor_id)
);

create table if not exists public.active_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id),
  hospital_id uuid not null references public.hospitals(id),
  gcal_event_id text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  notes text,
  sync_status public.sync_status not null default 'pending',
  is_historical boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_sub_id text,
  status public.subscription_status not null default 'free_trial',
  current_period_end timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_info text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.timetable_submissions (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.users(id) on delete cascade,
  hospital_id uuid not null references public.hospitals(id),
  target_month text not null,
  source_type text not null,
  file_url text,
  file_hash text,
  processing_status public.submission_status not null default 'pending',
  admin_feedback text,
  created_at timestamptz not null default now(),
  unique (hospital_id, target_month, file_hash)
);

create table if not exists public.daily_digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  related_doctor_id uuid references public.doctors(id),
  summary text not null,
  type public.digest_type not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.target_doctors enable row level security;
alter table public.active_appointments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_sessions enable row level security;
alter table public.timetable_submissions enable row level security;
alter table public.daily_digests enable row level security;
alter table public.hospitals enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_affiliations enable row level security;
alter table public.timetables enable row level security;

drop policy if exists users_owner_select on public.users;
create policy users_owner_select on public.users for select using (auth.uid() = id);

drop policy if exists users_owner_update on public.users;
create policy users_owner_update on public.users for update using (auth.uid() = id);

drop policy if exists target_doctors_owner_all on public.target_doctors;
create policy target_doctors_owner_all on public.target_doctors
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists active_appointments_owner_all on public.active_appointments;
create policy active_appointments_owner_all on public.active_appointments
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists subscriptions_owner_select on public.subscriptions;
create policy subscriptions_owner_select on public.subscriptions for select using (auth.uid() = user_id);

drop policy if exists user_sessions_owner_all on public.user_sessions;
create policy user_sessions_owner_all on public.user_sessions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists timetable_submissions_owner_select on public.timetable_submissions;
create policy timetable_submissions_owner_select on public.timetable_submissions
for select
using (auth.uid() = uploader_id);

drop policy if exists timetable_submissions_owner_insert on public.timetable_submissions;
create policy timetable_submissions_owner_insert on public.timetable_submissions
for insert
with check (auth.uid() = uploader_id);

drop policy if exists daily_digests_owner_all on public.daily_digests;
create policy daily_digests_owner_all on public.daily_digests
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists hospitals_authenticated_read on public.hospitals;
create policy hospitals_authenticated_read on public.hospitals
for select
using (auth.role() = 'authenticated');

drop policy if exists doctors_authenticated_read on public.doctors;
create policy doctors_authenticated_read on public.doctors
for select
using (auth.role() = 'authenticated');

drop policy if exists doctor_affiliations_authenticated_read on public.doctor_affiliations;
create policy doctor_affiliations_authenticated_read on public.doctor_affiliations
for select
using (auth.role() = 'authenticated');

drop policy if exists timetables_authenticated_read on public.timetables;
create policy timetables_authenticated_read on public.timetables
for select
using (auth.role() = 'authenticated');
