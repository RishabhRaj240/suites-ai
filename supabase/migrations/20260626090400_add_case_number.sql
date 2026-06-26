-- Add case_number generated column to cases
alter table public.cases add column if not exists case_number text;

-- Backfill case_number for existing rows using a CTE (window functions not allowed in UPDATE directly)
with numbered as (
  select id,
    'CASE-' || lpad(row_number() over (order by created_at)::text, 4, '0') as cn
  from public.cases
  where case_number is null
)
update public.cases
set case_number = numbered.cn
from numbered
where public.cases.id = numbered.id;

-- Make case_number auto-generate on insert via trigger
create or replace function public.generate_case_number()
returns trigger language plpgsql as $$
declare
  next_num integer;
begin
  select coalesce(max(cast(substring(case_number from 6) as integer)), 0) + 1
  into next_num
  from public.cases
  where user_id = new.user_id;
  new.case_number := 'CASE-' || lpad(next_num::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists set_case_number on public.cases;
create trigger set_case_number
  before insert on public.cases
  for each row
  when (new.case_number is null)
  execute procedure public.generate_case_number();
