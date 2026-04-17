CREATE TABLE IF NOT EXISTS public.appreciation_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appreciation_id UUID NOT NULL REFERENCES public.upvotes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (char_length(emoji) > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (appreciation_id, user_id)
);

ALTER TABLE public.appreciation_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view appreciation reactions" ON public.appreciation_reactions;
DROP POLICY IF EXISTS "Users can insert own appreciation reactions" ON public.appreciation_reactions;
DROP POLICY IF EXISTS "Users can update own appreciation reactions" ON public.appreciation_reactions;
DROP POLICY IF EXISTS "Users can delete own appreciation reactions" ON public.appreciation_reactions;

CREATE POLICY "Authenticated can view appreciation reactions"
ON public.appreciation_reactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own appreciation reactions"
ON public.appreciation_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update own appreciation reactions"
ON public.appreciation_reactions
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete own appreciation reactions"
ON public.appreciation_reactions
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
