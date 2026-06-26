-- Create drafts table for Drafting Agent
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  case_id uuid references public.cases(id) on delete set null,
  document_type text not null,
  party_a text not null,
  party_b text not null,
  jurisdiction text not null,
  key_facts text not null,
  document_content text not null,
  word_count integer,
  status text not null default 'draft',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.drafts enable row level security;

create policy "Users can read their own drafts"
  on public.drafts for select using (auth.uid() = user_id);

create policy "Users can insert their own drafts"
  on public.drafts for insert with check (auth.uid() = user_id);

create policy "Users can update their own drafts"
  on public.drafts for update using (auth.uid() = user_id);

create trigger drafts_updated_at
  before update on public.drafts
  for each row execute procedure public.handle_updated_at();
