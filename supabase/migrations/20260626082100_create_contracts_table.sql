-- Create contracts table for Contract Review Agent
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  risk_score integer,
  key_clauses jsonb,
  red_flags jsonb,
  ai_summary text,
  status text not null default 'pending',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.contracts enable row level security;

create policy "Users can read their own contracts"
  on public.contracts for select using (auth.uid() = user_id);

create policy "Users can insert their own contracts"
  on public.contracts for insert with check (auth.uid() = user_id);

create policy "Users can update their own contracts"
  on public.contracts for update using (auth.uid() = user_id);

-- Trigger updated_at
create trigger contracts_updated_at
  before update on public.contracts
  for each row execute procedure public.handle_updated_at();
