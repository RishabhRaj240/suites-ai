-- ═══════════════════════════════════════════════════════════════════
-- Schema Alignment Migration
-- Bridges existing tables to match the canonical Suites AI spec:
--   users · cases · contracts · drafts · research_logs
-- All changes are ADDITIVE — nothing existing is dropped.
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. contracts — add spec columns
--    Spec: (id, case_id, file_url, risk_score, analysis_json, created_at)
--    Existing extra cols kept: file_name, file_path, file_size, key_clauses,
--                              red_flags, ai_summary, status, updated_at
-- ───────────────────────────────────────────────────────────────────

alter table public.contracts
  add column if not exists case_id uuid references public.cases(id) on delete set null,
  add column if not exists file_url text,
  add column if not exists analysis_json jsonb;

-- Back-fill file_url from storage path for any existing rows
update public.contracts
set file_url = 'https://okvlcxybjlzahkvugemk.supabase.co/storage/v1/object/public/contracts/' || file_path
where file_url is null and file_path is not null and file_path <> '';

-- Back-fill analysis_json from existing structured columns
update public.contracts
set analysis_json = jsonb_build_object(
  'risk_score',  risk_score,
  'key_clauses', key_clauses,
  'red_flags',   red_flags,
  'ai_summary',  ai_summary
)
where analysis_json is null;

create index if not exists contracts_case_id_idx on public.contracts(case_id);

-- ───────────────────────────────────────────────────────────────────
-- 2. drafts — add spec columns
--    Spec: (id, case_id, doc_type, content, created_at)
--    Existing extra cols kept: document_type, party_a, party_b,
--                              jurisdiction, key_facts, document_content,
--                              word_count, status, updated_at
-- ───────────────────────────────────────────────────────────────────

alter table public.drafts
  add column if not exists case_id uuid references public.cases(id) on delete set null,
  add column if not exists doc_type text,
  add column if not exists content  text;

-- Back-fill spec aliases from existing columns
update public.drafts
set
  doc_type = document_type,
  content  = document_content
where doc_type is null;

create index if not exists drafts_case_id_idx on public.drafts(case_id);

-- Keep doc_type and document_type in sync on future inserts via trigger
create or replace function public.sync_draft_spec_columns()
returns trigger language plpgsql as $$
begin
  -- Spec → canonical
  if new.doc_type is not null and new.document_type is null then
    new.document_type := new.doc_type;
  end if;
  if new.content is not null and new.document_content is null then
    new.document_content := new.content;
  end if;
  -- Canonical → spec
  if new.document_type is not null and new.doc_type is null then
    new.doc_type := new.document_type;
  end if;
  if new.document_content is not null and new.content is null then
    new.content := new.document_content;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_draft_spec on public.drafts;
create trigger sync_draft_spec
  before insert or update on public.drafts
  for each row execute procedure public.sync_draft_spec_columns();

-- ───────────────────────────────────────────────────────────────────
-- 3. research_logs — new canonical table
--    Spec: (id, case_id, query, result_json, created_at)
--    research_queries table is kept as-is for backward compat.
--    New inserts go to research_logs; existing data migrated over.
-- ───────────────────────────────────────────────────────────────────

create table if not exists public.research_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  case_id     uuid references public.cases(id) on delete set null,
  query       text not null,
  result_json jsonb,
  created_at  timestamptz default now() not null
);

alter table public.research_logs enable row level security;

create policy "Users can read their own research logs"
  on public.research_logs for select using (auth.uid() = user_id);

create policy "Users can insert their own research logs"
  on public.research_logs for insert with check (auth.uid() = user_id);

create index if not exists research_logs_user_id_idx on public.research_logs(user_id);
create index if not exists research_logs_case_id_idx  on public.research_logs(case_id);

-- Migrate existing research_queries rows into research_logs
insert into public.research_logs (id, user_id, case_id, query, result_json, created_at)
select
  id,
  user_id,
  null as case_id,
  query,
  results as result_json,
  created_at
from public.research_queries
on conflict (id) do nothing;

-- ───────────────────────────────────────────────────────────────────
-- 4. Convenience view: `users`
--    Spec references a `users` table; Supabase uses auth.users + profiles.
--    Expose a view so any query to public.users works.
-- ───────────────────────────────────────────────────────────────────

create or replace view public.users as
select
  p.id,
  coalesce(p.full_name, p.email) as name,
  p.email,
  p.created_at
from public.profiles p;

-- Grant read to authenticated users
grant select on public.users to authenticated;
