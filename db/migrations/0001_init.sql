-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- clients: one row per contractor we serve
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  business_name text not null,
  trade text not null check (trade in ('plumber','electrician','hvac','multi')),
  owner_name text not null,
  owner_phone text not null,
  twilio_number text,
  vapi_assistant_id text,
  greeting text default 'Hi, how can I help?',
  agent_name text default 'Mike',
  pricing_json jsonb default '{}'::jsonb,
  emergency_keywords text[] default array['burst pipe','flooding','sewage','no water','gas smell','sparks','smoke'],
  business_hours jsonb default '{"mon":[8,18],"tue":[8,18],"wed":[8,18],"thu":[8,18],"fri":[8,18],"sat":[9,15],"sun":null}'::jsonb,
  after_hours_mode boolean default true,
  google_refresh_token text,
  google_access_token text,
  google_token_expires_at timestamptz,
  google_calendar_id text default 'primary',
  status text default 'trial' check (status in ('trial','active','paused','churned')),
  plan text default 'starter' check (plan in ('starter','performance','whitelabel')),
  avg_ticket_usd numeric default 350,
  close_rate numeric default 0.6,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.clients(owner_user_id);
create unique index on public.clients(twilio_number) where twilio_number is not null;

-- calls: every inbound call
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  vapi_call_id text unique,
  caller_name text,
  caller_phone text,
  caller_address text,
  problem_summary text,
  urgency text check (urgency in ('emergency','same_day','standard','unknown')),
  outcome text check (outcome in ('booked','quoted','message','escalated','abandoned')),
  duration_sec int,
  transcript text,
  audio_url text,
  summary text,
  structured_data jsonb,
  cost_usd numeric,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);
create index on public.calls(client_id, created_at desc);
create index on public.calls(urgency);
create index on public.calls(outcome);

-- bookings: appointments the agent created
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  call_id uuid references public.calls(id) on delete set null,
  scheduled_at timestamptz not null,
  duration_min int default 60,
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  problem_summary text,
  status text default 'scheduled' check (status in ('scheduled','confirmed','showed','no_show','completed','cancelled')),
  estimated_value_usd numeric,
  actual_value_usd numeric,
  external_event_id text,
  created_at timestamptz default now()
);
create index on public.bookings(client_id, scheduled_at desc);

-- emergencies: triggered escalations
create table public.emergencies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  call_id uuid references public.calls(id) on delete set null,
  trigger_keyword text,
  summary text,
  sms_sid text,
  sms_sent_at timestamptz default now(),
  acknowledged_at timestamptz,
  created_at timestamptz default now()
);

-- prompt_versions: per-client prompt history
create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  version int not null,
  system_prompt text not null,
  active boolean default false,
  created_at timestamptz default now()
);
create unique index on public.prompt_versions(client_id, version);
create unique index on public.prompt_versions(client_id) where active = true;

-- updated_at trigger for clients
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;
create trigger clients_updated before update on public.clients
  for each row execute function public.touch_updated_at();

-- Row Level Security
alter table public.clients enable row level security;
alter table public.calls enable row level security;
alter table public.bookings enable row level security;
alter table public.emergencies enable row level security;
alter table public.prompt_versions enable row level security;

-- Policies: contractor sees only their own data via clients.owner_user_id
create policy clients_owner on public.clients
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

create policy calls_owner on public.calls
  for all using (
    exists (select 1 from public.clients c where c.id = calls.client_id and c.owner_user_id = auth.uid())
  );

create policy bookings_owner on public.bookings
  for all using (
    exists (select 1 from public.clients c where c.id = bookings.client_id and c.owner_user_id = auth.uid())
  );

create policy emergencies_owner on public.emergencies
  for all using (
    exists (select 1 from public.clients c where c.id = emergencies.client_id and c.owner_user_id = auth.uid())
  );

create policy prompt_versions_owner on public.prompt_versions
  for all using (
    exists (select 1 from public.clients c where c.id = prompt_versions.client_id and c.owner_user_id = auth.uid())
  );

-- (service_role key bypasses RLS by default — webhook handlers will use it)
