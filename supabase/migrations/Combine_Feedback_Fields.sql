-- Combine situation and impact columns into a single content column
-- 1. Add the new content column
ALTER TABLE public.feedback ADD COLUMN content TEXT;

-- 2. Migrate existing data: concatenate situation and impact
UPDATE public.feedback SET content = situation || E'\n\n' || impact;

-- 3. Make content NOT NULL now that all rows have data
ALTER TABLE public.feedback ALTER COLUMN content SET NOT NULL;

-- 4. Drop the old columns
ALTER TABLE public.feedback DROP COLUMN situation;
ALTER TABLE public.feedback DROP COLUMN impact;
