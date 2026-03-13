ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN;

-- Existing feedback rows predate this feature, so keep them non-anonymous by default.
UPDATE public.feedback
SET is_anonymous = false
WHERE is_anonymous IS NULL;

ALTER TABLE public.feedback
ALTER COLUMN is_anonymous SET DEFAULT true;

ALTER TABLE public.feedback
ALTER COLUMN is_anonymous SET NOT NULL;
