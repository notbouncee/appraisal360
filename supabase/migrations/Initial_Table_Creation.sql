
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  team TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can see own feedback" ON public.feedback FOR SELECT TO authenticated
  USING (author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Recipients can see received feedback" ON public.feedback FOR SELECT TO authenticated
  USING (recipient_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert feedback" ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authors can update own feedback" ON public.feedback FOR UPDATE TO authenticated
  USING (author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authors can delete own feedback" ON public.feedback FOR DELETE TO authenticated
  USING (author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Upvotes table
CREATE TABLE public.upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  upvoted_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (voter_id, upvoted_id)
);

ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voters can see own upvotes" ON public.upvotes FOR SELECT TO authenticated
  USING (voter_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Recipients can see received upvotes" ON public.upvotes FOR SELECT TO authenticated
  USING (upvoted_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert upvotes" ON public.upvotes FOR INSERT TO authenticated
  WITH CHECK (
    voter_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND upvoted_id <> (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own upvotes" ON public.upvotes FOR DELETE TO authenticated
  USING (voter_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
