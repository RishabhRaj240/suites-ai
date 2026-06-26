-- Create research_queries table for Research Agent
create table if not exists public.research_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  query text not null,
  results jsonb,
  created_at timestamptz default now() not null
);

alter table public.research_queries enable row level security;

create policy "Users can read their own research queries"
  on public.research_queries for select using (auth.uid() = user_id);

create policy "Users can insert their own research queries"
  on public.research_queries for insert with check (auth.uid() = user_id);
