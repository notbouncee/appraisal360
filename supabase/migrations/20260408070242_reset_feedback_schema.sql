-- 1. Delete all existing records
truncate table public.feedback restart identity cascade;

-- 2. Re-add (or ensure) required columns
alter table public.feedback
add column if not exists situation text;

alter table public.feedback
add column if not exists impact text;

alter table public.feedback
add column if not exists behaviour text;

alter table public.feedback
add column if not exists optional text;

-- 3. Ensure NOT NULL constraints (required fields)
alter table public.feedback
alter column situation set not null;

alter table public.feedback
alter column impact set not null;

alter table public.feedback
alter column behaviour set not null;

-- 4. Ensure optional field stays nullable
alter table public.feedback
alter column optional drop not null;