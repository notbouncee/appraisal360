-- 1. Drop all existing records
DELETE FROM public.upvotes;

-- 2. Add message column
ALTER TABLE public.upvotes
ADD COLUMN message TEXT;

-- 3. Backfill (optional safety)
UPDATE public.upvotes
SET message = 'No message'
WHERE message IS NULL;

-- 4. Make NOT NULL
ALTER TABLE public.upvotes
ALTER COLUMN message SET NOT NULL;

-- 5. Drop old policies
DROP POLICY IF EXISTS "Voters can see own upvotes" ON public.upvotes;
DROP POLICY IF EXISTS "Recipients can see received upvotes" ON public.upvotes;
DROP POLICY IF EXISTS "Users can insert upvotes" ON public.upvotes;
DROP POLICY IF EXISTS "Users can delete own upvotes" ON public.upvotes;

-- 6. New public read policy
CREATE POLICY "Public can view all upvotes"
ON public.upvotes
FOR SELECT
TO authenticated
USING (true);

-- 7. Insert policy
CREATE POLICY "Users can insert upvotes"
ON public.upvotes
FOR INSERT
TO authenticated
WITH CHECK (
  voter_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND upvoted_id <> (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND message IS NOT NULL
);

-- 8. Delete policy
CREATE POLICY "Users can delete own upvotes"
ON public.upvotes
FOR DELETE
TO authenticated
USING (
  voter_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);