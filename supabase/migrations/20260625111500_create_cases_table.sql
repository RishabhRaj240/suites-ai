-- Create cases table for Intake Agent
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_name text not null,
  case_type text not null,
  description text not null,
  contact_info text not null,
  intake_date date not null,
  ai_summary text,
  status text not null default 'active',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Row Level Security
alter table public.cases enable row level security;

-- Users can only access their own cases
create policy "Users can read their own cases"
  on public.cases for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cases"
  on public.cases for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cases"
  on public.cases for update
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cases_updated_at
  before update on public.cases
  for each row execute procedure public.handle_updated_at();
