from src.client.db import get_connection


def ensure_schema() -> None:
    ddl = """
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      display_name TEXT NOT NULL DEFAULT '',
      team TEXT NOT NULL DEFAULT '',
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
      password_changed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'member'))
    );

    CREATE TABLE IF NOT EXISTS public.feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      situation TEXT NOT NULL,
      behaviour TEXT NOT NULL,
      impact TEXT NOT NULL,
      optional TEXT,
      is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.upvotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      upvoted_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.appreciation_reactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      appreciation_id UUID NOT NULL REFERENCES public.upvotes(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL CHECK (char_length(emoji) > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (appreciation_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS public.review_cycles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (year, quarter)
    );

    CREATE INDEX IF NOT EXISTS idx_feedback_recipient_id ON public.feedback (recipient_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_author_id ON public.feedback (author_id);
    CREATE INDEX IF NOT EXISTS idx_upvotes_upvoted_id ON public.upvotes (upvoted_id);
    CREATE INDEX IF NOT EXISTS idx_upvotes_voter_id ON public.upvotes (voter_id);

    ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON public.profiles (email);

    CREATE OR REPLACE FUNCTION public.set_updated_at_column()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$;

    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();

    DROP TRIGGER IF EXISTS update_review_cycles_updated_at ON public.review_cycles;
    CREATE TRIGGER update_review_cycles_updated_at
      BEFORE UPDATE ON public.review_cycles
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(ddl)
