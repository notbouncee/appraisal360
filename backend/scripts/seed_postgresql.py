"""Seed demo data into PostgreSQL for local/dev.

What it does
- Creates (or updates) tables equivalent to the current Supabase public schema
- Upserts demo profiles
- Re-seeds feedback and upvotes demo data
- Ensures review cycle rows for the current year exist

Requirements
- Python 3.9+
- psycopg[binary]
- Environment variables:
  - POSTGRES_DB
  - POSTGRES_USER
  - POSTGRES_PASSWORD
  - POSTGRES_HOST (optional, default: localhost)
  - POSTGRES_PORT (optional, default: 5432)
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import sys
import uuid
from dataclasses import dataclass
from pathlib import Path

import psycopg

from src.core.security import hash_password


@dataclass(frozen=True)
class SeedUser:
    email: str
    password: str
    display_name: str
    team: str
    role: str = "member"

SEED_USERS: list[SeedUser] = [
    SeedUser(email="tania@htx.gov.sg", password="password123", display_name="Tania Foo", team="Alpha"),
    SeedUser(email="adrian@htx.gov.sg", password="password123", display_name="Adrian Tok", team="Alpha"),
    SeedUser(email="john@htx.gov.sg", password="password123", display_name="John Zhang", team="Beta"),
    SeedUser(email="jules@htx.gov.sg", password="password123", display_name="Jules Ang", team="Beta"),
    SeedUser(email="yinyun@htx.gov.sg", password="password123", display_name="Tan Yin Yu", team="Alpha"),
    SeedUser(email="vince@htx.gov.sg", password="password123", display_name="Vince Ong", team="Alpha", role ="admin"),
    SeedUser(email="aaron.tan@htx.gov.sg", password="password123", display_name="Aaron Tan", team="Bravo"),
    SeedUser(email="benjamin.lim@htx.gov.sg", password="password123", display_name="Benjamin Lim", team="Alpha"),
    SeedUser(email="charles.ng@htx.gov.sg", password="password123", display_name="Charles Ng", team="Bravo"),
    SeedUser(email="daniel.ong@htx.gov.sg", password="password123", display_name="Daniel Ong", team="Alpha"),
    SeedUser(email="ethan.goh@htx.gov.sg", password="password123", display_name="Ethan Goh", team="Bravo"),
    SeedUser(email="felix.chua@htx.gov.sg", password="password123", display_name="Felix Chua", team="Alpha"),
    SeedUser(email="gabriel.koh@htx.gov.sg", password="password123", display_name="Gabriel Koh", team="Bravo"),
    SeedUser(email="henry.lee@htx.gov.sg", password="password123", display_name="Henry Lee", team="Bravo"),
    SeedUser(email="ivan.teo@htx.gov.sg", password="password123", display_name="Ivan Teo", team="Alpha"),
    SeedUser(email="jason.tan@htx.gov.sg", password="password123", display_name="Jason Tan", team="Alpha"),
    SeedUser(email="kevin.lim@htx.gov.sg", password="password123", display_name="Kevin Lim", team="Alpha"),
    SeedUser(email="leon.ng@htx.gov.sg", password="password123", display_name="Leon Ng", team="Bravo"),
    SeedUser(email="michael.ong@htx.gov.sg", password="password123", display_name="Michael Ong", team="Alpha"),
    SeedUser(email="nicholas.goh@htx.gov.sg", password="password123", display_name="Nicholas Goh", team="Bravo"),
    SeedUser(email="ryan.chua@htx.gov.sg", password="password123", display_name="Ryan Chua", team="Bravo"),
]


def _load_env_from_repo_root() -> None:
    scripts_dir = Path(__file__).resolve().parent
    backend_dir = scripts_dir.parent
    for candidate in (scripts_dir / ".env", scripts_dir / ".env.example", backend_dir / ".env"):
        if not candidate.exists():
            continue
        for line in candidate.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, raw_value = line.split("=", 1)
            os.environ.setdefault(key.strip(), raw_value.strip().strip('"').strip("'"))


def _require_env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value:
        return value
    raise SystemExit(f"Missing required env var: {name}")


def _make_user_uuid(email: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_DNS, f"appraisal360:{email.lower()}")


def _create_tables(conn: psycopg.Connection) -> None:
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
            tokens_revoked_at TIMESTAMPTZ,
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

        CREATE TABLE IF NOT EXISTS public.feedback_questions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            label TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            is_required BOOLEAN NOT NULL DEFAULT TRUE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (label)
        );

    CREATE INDEX IF NOT EXISTS idx_feedback_recipient_id ON public.feedback (recipient_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_author_id ON public.feedback (author_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_upvotes_upvoted_id ON public.upvotes (upvoted_id);
    CREATE INDEX IF NOT EXISTS idx_upvotes_voter_id ON public.upvotes (voter_id);
    CREATE INDEX IF NOT EXISTS idx_upvotes_created_at ON public.upvotes (created_at DESC);

    ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
    ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS tokens_revoked_at TIMESTAMPTZ;
    ALTER TABLE IF EXISTS public.feedback_questions ADD COLUMN IF NOT EXISTS description TEXT;
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

        DROP TRIGGER IF EXISTS update_feedback_questions_updated_at ON public.feedback_questions;
        CREATE TRIGGER update_feedback_questions_updated_at
            BEFORE UPDATE ON public.feedback_questions
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();
    """
    with conn.cursor() as cur:
        cur.execute(ddl)


def _upsert_profiles(conn: psycopg.Connection) -> dict[str, uuid.UUID]:
    profile_ids: dict[str, uuid.UUID] = {}
    upsert_sql = """
    INSERT INTO public.profiles (id, user_id, email, password_hash, display_name, team, role, must_change_password)
    VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
        ON CONFLICT (user_id)
    DO UPDATE SET
            email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      display_name = EXCLUDED.display_name,
      team = EXCLUDED.team,
      role = COALESCE(public.profiles.role, EXCLUDED.role)
    RETURNING id;
    """
    with conn.cursor() as cur:
        for user in SEED_USERS:
            user_uuid = _make_user_uuid(user.email)
            cur.execute(
                upsert_sql,
                (user_uuid, user_uuid, user.email.lower(), hash_password(user.password), user.display_name, user.team, user.role),
            )
            profile_id = cur.fetchone()[0]
            profile_ids[user.email] = profile_id
            print(f"  ok {user.display_name} ({user.email})")
    return profile_ids


def _seed_review_cycles(conn: psycopg.Connection, year: int) -> None:
    rows = [
        (year, 1, "End of Year Review", "Reflect on the past year's achievements and set goals for the new year.", dt.date(year, 1, 1), dt.date(year, 1, 7)),
        (year, 2, "1st Quarter Feedback", "Provide feedback on Q1 performance and collaboration.", dt.date(year, 4, 1), dt.date(year, 4, 7)),
        (year, 3, "Mid-Year Review", "Mid-year check-in on progress, goals, and development.", dt.date(year, 7, 1), dt.date(year, 7, 7)),
        (year, 4, "3rd Quarter Feedback", "Provide feedback on Q3 performance and prepare for year-end.", dt.date(year, 10, 1), dt.date(year, 10, 7)),
    ]
    sql = """
    INSERT INTO public.review_cycles (year, quarter, title, description, start_date, end_date)
    VALUES (%s, %s, %s, %s, %s, %s)
    ON CONFLICT (year, quarter) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date;
    """
    with conn.cursor() as cur:
        cur.executemany(sql, rows)


def _clear_seed_targets(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute("DELETE FROM public.appreciation_reactions;")
        cur.execute("DELETE FROM public.feedback;")
        cur.execute("DELETE FROM public.upvotes;")


def _insert_feedback(conn: psycopg.Connection, profile_ids: dict[str, uuid.UUID]) -> None:
    pid = lambda email: profile_ids[email]
    rows = [
        (pid("adrian@htx.gov.sg"), pid("tania@htx.gov.sg"), "During the Q3 release cycle when the team was under pressure to ship.", "Tania proactively reviewed two PRs that were blocking the release, even though they weren't assigned to her.", "The release went out on time and the team avoided a stressful all-hands crunch.", "Really appreciated the initiative - it set a great example for the rest of us.", False),
        (pid("john@htx.gov.sg"), pid("tania@htx.gov.sg"), "After the production incident last month.", "Tania wrote a clear and blameless postmortem with concrete follow-up action items.", "The team had a shared understanding of what went wrong and confidence that it wouldn't repeat.", None, True),
        (pid("jules@htx.gov.sg"), pid("tania@htx.gov.sg"), "In the cross-team planning meeting for the new dashboard feature.", "Tania asked clarifying questions early and surfaced a dependency that would have caused a two-week delay.", "We were able to re-sequence the work and hit the milestone without a slip.", None, False),
        (pid("tania@htx.gov.sg"), pid("adrian@htx.gov.sg"), "When onboarding the two new joiners in January.", "Adrian put together a structured onboarding guide and paired with each person for their first week.", "Both new teammates were productive within two weeks, which is faster than usual.", "This kind of mentoring lifts the whole team's velocity.", False),
        (pid("kevin.lim@htx.gov.sg"), pid("adrian@htx.gov.sg"), "During the API performance investigation in February.", "Adrian dug into the profiling data independently and identified the N+1 query that was causing the slowdown.", "Response times dropped by 60% after the fix, which unblocked the mobile team.", None, False),
        (pid("benjamin.lim@htx.gov.sg"), pid("john@htx.gov.sg"), "During the sprint retrospective in March.", "John facilitated the retro in a way that gave everyone space to speak, including quieter team members.", "We surfaced two process issues we hadn't talked about before and agreed on fixes.", None, False),
        (pid("yinyun@htx.gov.sg"), pid("jules@htx.gov.sg"), "When I was stuck on a tricky CSS layout issue for two days.", "Jules sat with me for 30 minutes, asked good questions, and helped me see the problem differently.", "I solved it within the hour and learned a debugging approach I've used three times since.", "Really grateful for the patience.", False),
        (pid("daniel.ong@htx.gov.sg"), pid("vince@htx.gov.sg"), "During the data migration project in Q1.", "Vince caught a data integrity issue in the migration script during review before it ran in production.", "We avoided what could have been a serious data loss incident affecting thousands of records.", "Sharp eye for detail under time pressure.", False),
        (pid("ethan.goh@htx.gov.sg"), pid("vince@htx.gov.sg"), "In our weekly syncs over the past quarter.", "Vince consistently comes prepared with status updates and flags risks early.", "Our team leads always have the information they need to make decisions without chasing anyone.", None, True),
    ]

    sql = """
    INSERT INTO public.feedback (author_id, recipient_id, situation, behaviour, impact, optional, is_anonymous)
    VALUES (%s, %s, %s, %s, %s, %s, %s);
    """
    with conn.cursor() as cur:
        cur.executemany(sql, rows)
    print(f"  ok Inserted {len(rows)} feedback rows")


def _insert_upvotes(conn: psycopg.Connection, profile_ids: dict[str, uuid.UUID]) -> None:
    pid = lambda email: profile_ids[email]
    rows = [
        (pid("adrian@htx.gov.sg"), pid("tania@htx.gov.sg"), "Always goes above and beyond to help the team ship."),
        (pid("john@htx.gov.sg"), pid("tania@htx.gov.sg"), "Clear communicator under pressure."),
        (pid("jules@htx.gov.sg"), pid("tania@htx.gov.sg"), "Great at spotting blockers early."),
        (pid("yinyun@htx.gov.sg"), pid("tania@htx.gov.sg"), "Dependable and thorough."),
        (pid("tania@htx.gov.sg"), pid("adrian@htx.gov.sg"), "Excellent mentor - made the new joiners feel welcome."),
        (pid("john@htx.gov.sg"), pid("adrian@htx.gov.sg"), "Deep technical knowledge shared generously."),
        (pid("kevin.lim@htx.gov.sg"), pid("adrian@htx.gov.sg"), "Saved us weeks of pain with that perf fix."),
        (pid("tania@htx.gov.sg"), pid("john@htx.gov.sg"), "Runs the best retros I've been part of."),
        (pid("benjamin.lim@htx.gov.sg"), pid("john@htx.gov.sg"), "Makes everyone feel heard."),
        (pid("tania@htx.gov.sg"), pid("jules@htx.gov.sg"), "Patient and insightful when helping others debug."),
        (pid("yinyun@htx.gov.sg"), pid("jules@htx.gov.sg"), "Helped me grow more than anyone this quarter."),
        (pid("daniel.ong@htx.gov.sg"), pid("vince@htx.gov.sg"), "Saved the data migration - sharp eye."),
        (pid("ethan.goh@htx.gov.sg"), pid("vince@htx.gov.sg"), "Always prepared, never drops the ball."),
        (pid("felix.chua@htx.gov.sg"), pid("vince@htx.gov.sg"), "Reliable and low drama. Great teammate."),
        (pid("gabriel.koh@htx.gov.sg"), pid("kevin.lim@htx.gov.sg"), "Super helpful whenever I reach out cross-team."),
        (pid("henry.lee@htx.gov.sg"), pid("michael.ong@htx.gov.sg"), "Great technical documentation this sprint."),
        (pid("leon.ng@htx.gov.sg"), pid("jason.tan@htx.gov.sg"), "Unblocked our team quickly during the integration work."),
        (pid("ryan.chua@htx.gov.sg"), pid("nicholas.goh@htx.gov.sg"), "Always willing to pair on hard problems."),
        (pid("aaron.tan@htx.gov.sg"), pid("ivan.teo@htx.gov.sg"), "Solid code reviews with clear, actionable comments."),
        (pid("charles.ng@htx.gov.sg"), pid("benjamin.lim@htx.gov.sg"), "Great at breaking down complex problems in planning."),
    ]

    sql = """
    INSERT INTO public.upvotes (voter_id, upvoted_id, message)
    VALUES (%s, %s, %s);
    """
    with conn.cursor() as cur:
        cur.executemany(sql, rows)
    print(f"  ok Inserted {len(rows)} upvote rows")


def _seed_feedback_questions(conn: psycopg.Connection) -> None:
    rows = [
        ("Situation", "Briefly explain the situation/interaction you had with this person", True, 1, True),
        ("Behaviour", "What did they do in that situation that stood out (positively or negatively)?", True, 2, True),
        ("Impact", "How did it impact you, the team or the work outcome?", True, 3, True),
        ("Additional Comments", "(Optional) What is one thing you'd encourage them to continue or suggest doing differently", False, 4, True),
    ]

    sql = """
        INSERT INTO public.feedback_questions (label, description, is_required, sort_order, is_active)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (label) DO UPDATE SET
            description = EXCLUDED.description,
            is_required = EXCLUDED.is_required,
            sort_order = EXCLUDED.sort_order,
            is_active = EXCLUDED.is_active;
        """
    with conn.cursor() as cur:
        cur.executemany(sql, rows)
    print("  ok Seeded feedback questions")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Seed PostgreSQL with demo users, profiles, feedback, and upvotes.")
    parser.add_argument("--print-creds", action="store_true", help="Print demo login credentials at the end.")
    args = parser.parse_args(argv)

    _load_env_from_repo_root()

    host = _require_env("POSTGRES_HOST", "localhost")
    port = _require_env("POSTGRES_PORT", "5432")
    db_name = _require_env("POSTGRES_DB")
    user = _require_env("POSTGRES_USER")
    password = _require_env("POSTGRES_PASSWORD")

    dsn = f"host={host} port={port} dbname={db_name} user={user} password={password}"

    with psycopg.connect(dsn) as conn:
        conn.autocommit = False

        print("Creating/verifying tables...")
        _create_tables(conn)

        print("\nUpserting profiles...")
        profile_ids = _upsert_profiles(conn)

        print("\nSeeding review cycles...")
        _seed_review_cycles(conn, dt.date.today().year)

        print("\nSeeding feedback questions...")
        _seed_feedback_questions(conn)

        print("\nClearing previous seeded feedback/upvotes...")
        _clear_seed_targets(conn)

        print("\nSeeding feedback...")
        _insert_feedback(conn, profile_ids)

        print("\nSeeding upvotes...")
        _insert_upvotes(conn, profile_ids)

        conn.commit()

    print("\nSeed complete.")
    if args.print_creds:
        print("\nDemo logins (email / password):")
        for u in SEED_USERS:
            print(f"  - {u.email} / {u.password}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
