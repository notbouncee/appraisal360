-- Review cycles table: stores the 4 quarterly phases per year
CREATE TABLE public.review_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (year, quarter)
);

ALTER TABLE public.review_cycles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view review cycles
CREATE POLICY "Anyone can view review cycles"
  ON public.review_cycles FOR SELECT TO authenticated USING (true);

-- Only allow insert/update/delete for authenticated users (admin check can be added later)
CREATE POLICY "Authenticated users can insert review cycles"
  ON public.review_cycles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update review cycles"
  ON public.review_cycles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete review cycles"
  ON public.review_cycles FOR DELETE TO authenticated USING (true);

-- Updated_at trigger
CREATE TRIGGER update_review_cycles_updated_at
  BEFORE UPDATE ON public.review_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-generate review cycles for a given year
-- Inserts the 4 default phases only if they don't already exist
CREATE OR REPLACE FUNCTION public.ensure_review_cycles(target_year INTEGER DEFAULT EXTRACT(YEAR FROM now())::INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.review_cycles (year, quarter, title, description, start_date, end_date)
  VALUES
    (target_year, 1, 'End of Year Review',
     'Reflect on the past year''s achievements and set goals for the new year.',
     make_date(target_year, 1, 1), make_date(target_year, 1, 7)),
    (target_year, 2, '1st Quarter Feedback',
     'Provide feedback on Q1 performance and collaboration.',
     make_date(target_year, 4, 1), make_date(target_year, 4, 7)),
    (target_year, 3, 'Mid-Year Review',
     'Mid-year check-in on progress, goals, and development.',
     make_date(target_year, 7, 1), make_date(target_year, 7, 7)),
    (target_year, 4, '3rd Quarter Feedback',
     'Provide feedback on Q3 performance and prepare for year-end.',
     make_date(target_year, 10, 1), make_date(target_year, 10, 7))
  ON CONFLICT (year, quarter) DO NOTHING;
END;
$$;

-- Generate cycles for the current year (2026) immediately
SELECT public.ensure_review_cycles();

-- Schedule a daily cron job at midnight Jan 1 to generate next year's cycles
-- This uses pg_cron (enabled by default on Supabase)
-- Runs at 00:01 on January 1st every year
SELECT cron.schedule(
  'generate-yearly-review-cycles',
  '1 0 1 1 *',
  $$SELECT public.ensure_review_cycles()$$
);
