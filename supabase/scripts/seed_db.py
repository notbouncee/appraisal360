"""Seed demo data into Supabase for local/dev.

What it does
- Creates (or reuses) a few Supabase Auth users with known passwords
- Ensures their `public.profiles` rows exist (your `handle_new_user` trigger)
- Updates profiles with display_name/team
- Inserts some sample feedback and upvotes so the UI has content immediately

Requirements
- Python 3.9+
- Environment variables:
  - SUPABASE_URL (or VITE_SUPABASE_URL)
  - SUPABASE_SERVICE_ROLE_KEY  (never use the anon key for this)

Usage (PowerShell)
  $env:SUPABASE_SERVICE_ROLE_KEY = "<your service role key>"
    python supabase/scripts/seed_db.py

Note
This script uses the Service Role key, which bypasses RLS. Treat it like a secret.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class SeedUser:
    email: str
    password: str
    display_name: str
    team: str


SEED_USERS: list[SeedUser] = [
    SeedUser(email="tania@htx.gov.sg",        password="password123", display_name="Tania Foo",     team="Alpha"),
    SeedUser(email="adrian@htx.gov.sg",       password="password123", display_name="Adrian Tok",    team="Alpha"),
    SeedUser(email="john@htx.gov.sg",         password="password123", display_name="John Zhang",    team="Beta"),
    SeedUser(email="jules@htx.gov.sg",        password="password123", display_name="Jules Ang",     team="Beta"),
    SeedUser(email="yinyun@htx.gov.sg",       password="password123", display_name="Tan Yin Yu",    team="Alpha"),
    SeedUser(email="vince@htx.gov.sg",        password="password123", display_name="Vince Ong",     team="Alpha"),
    SeedUser(email="aaron.tan@htx.gov.sg",    password="password123", display_name="Aaron Tan",     team="Bravo"),
    SeedUser(email="benjamin.lim@htx.gov.sg", password="password123", display_name="Benjamin Lim",  team="Alpha"),
    SeedUser(email="charles.ng@htx.gov.sg",   password="password123", display_name="Charles Ng",    team="Bravo"),
    SeedUser(email="daniel.ong@htx.gov.sg",   password="password123", display_name="Daniel Ong",    team="Alpha"),
    SeedUser(email="ethan.goh@htx.gov.sg",    password="password123", display_name="Ethan Goh",     team="Bravo"),
    SeedUser(email="felix.chua@htx.gov.sg",   password="password123", display_name="Felix Chua",    team="Alpha"),
    SeedUser(email="gabriel.koh@htx.gov.sg",  password="password123", display_name="Gabriel Koh",   team="Bravo"),
    SeedUser(email="henry.lee@htx.gov.sg",    password="password123", display_name="Henry Lee",     team="Bravo"),
    SeedUser(email="ivan.teo@htx.gov.sg",     password="password123", display_name="Ivan Teo",      team="Alpha"),
    SeedUser(email="jason.tan@htx.gov.sg",    password="password123", display_name="Jason Tan",     team="Alpha"),
    SeedUser(email="kevin.lim@htx.gov.sg",    password="password123", display_name="Kevin Lim",     team="Alpha"),
    SeedUser(email="leon.ng@htx.gov.sg",      password="password123", display_name="Leon Ng",       team="Bravo"),
    SeedUser(email="michael.ong@htx.gov.sg",  password="password123", display_name="Michael Ong",   team="Alpha"),
    SeedUser(email="nicholas.goh@htx.gov.sg", password="password123", display_name="Nicholas Goh",  team="Bravo"),
    SeedUser(email="ryan.chua@htx.gov.sg",    password="password123", display_name="Ryan Chua",     team="Bravo"),
]


class SupabaseHttpError(RuntimeError):
    def __init__(self, message: str, status: int | None = None, details: Any | None = None):
        super().__init__(message)
        self.status = status
        self.details = details


def _load_env_from_repo_root() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    env_path = repo_root / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, raw_value = line.split("=", 1)
        key = key.strip()
        value = raw_value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def _require_env(*names: str) -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    raise SystemExit(f"Missing env var. Set one of: {', '.join(names)}")


def _request_json(method: str, url: str, headers: dict[str, str], body: Any | None = None) -> Any:
    data: bytes | None
    if body is None:
        data = None
    else:
        data = json.dumps(body).encode("utf-8")
        headers = {**headers, "Content-Type": "application/json"}

    req = urllib.request.Request(url=url, method=method, headers=headers, data=data)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return None
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                return raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        details: Any
        try:
            details = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            details = raw
        raise SupabaseHttpError(
            message=f"HTTP {e.code} calling {method} {url}",
            status=int(e.code),
            details=details,
        ) from e


def _auth_headers(service_role_key: str) -> dict[str, str]:
    return {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
    }


def _auth_admin_base(supabase_url: str) -> str:
    return supabase_url.rstrip("/") + "/auth/v1/admin"


def _rest_base(supabase_url: str) -> str:
    return supabase_url.rstrip("/") + "/rest/v1"


def _list_users(supabase_url: str, service_role_key: str) -> list[dict[str, Any]]:
    base = _auth_admin_base(supabase_url)
    headers = _auth_headers(service_role_key)
    users: list[dict[str, Any]] = []
    page = 1
    per_page = 200
    while True:
        url = f"{base}/users?{urllib.parse.urlencode({'page': page, 'per_page': per_page})}"
        payload = _request_json("GET", url, headers)
        page_users = payload.get("users", []) if isinstance(payload, dict) else []
        if not page_users:
            break
        users.extend(page_users)
        if len(page_users) < per_page:
            break
        page += 1
    return users


def _ensure_auth_user(supabase_url: str, service_role_key: str, seed_user: SeedUser) -> str:
    existing = None
    for user in _list_users(supabase_url, service_role_key):
        if (user.get("email") or "").lower() == seed_user.email.lower():
            existing = user
            break
    if existing:
        return str(existing["id"])
    base = _auth_admin_base(supabase_url)
    headers = _auth_headers(service_role_key)
    url = f"{base}/users"
    payload = {
        "email": seed_user.email,
        "password": seed_user.password,
        "email_confirm": True,
        "user_metadata": {"display_name": seed_user.display_name},
    }
    created = _request_json("POST", url, headers, body=payload)
    if not isinstance(created, dict) or "id" not in created:
        raise SupabaseHttpError("Unexpected response creating user", details=created)
    return str(created["id"])


def _get_profile_by_user_id(supabase_url: str, service_role_key: str, user_id: str) -> dict[str, Any] | None:
    rest = _rest_base(supabase_url)
    headers = {**_auth_headers(service_role_key), "Accept": "application/json"}
    query = urllib.parse.urlencode({"select": "id,user_id,display_name,team", "user_id": f"eq.{user_id}"})
    url = f"{rest}/profiles?{query}"
    rows = _request_json("GET", url, headers)
    if isinstance(rows, list) and rows:
        return rows[0]
    return None


def _update_profile(supabase_url: str, service_role_key: str, user_id: str, display_name: str, team: str) -> None:
    rest = _rest_base(supabase_url)
    headers = {**_auth_headers(service_role_key), "Prefer": "return=representation", "Accept": "application/json"}
    query = urllib.parse.urlencode({"user_id": f"eq.{user_id}"})
    url = f"{rest}/profiles?{query}"
    _request_json("PATCH", url, headers, body={"display_name": display_name, "team": team})



def _delete_seed_upvotes(supabase_url: str, service_role_key: str, upvote_pairs: list[tuple[str, str]]) -> None:
    """Delete specific voter/upvoted pairs so re-runs don't hit the unique constraint."""
    if not upvote_pairs:
        return
    rest = _rest_base(supabase_url)
    headers = {**_auth_headers(service_role_key), "Accept": "application/json"}
    for voter_id, upvoted_id in upvote_pairs:
        query = urllib.parse.urlencode({"voter_id": f"eq.{voter_id}", "upvoted_id": f"eq.{upvoted_id}"})
        url = f"{rest}/upvotes?{query}"
        _request_json("DELETE", url, headers)


def _insert_feedback(supabase_url: str, service_role_key: str, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    rest = _rest_base(supabase_url)
    headers = {**_auth_headers(service_role_key), "Prefer": "return=representation", "Accept": "application/json"}
    url = f"{rest}/feedback"
    for i, row in enumerate(rows):
        try:
            _request_json("POST", url, headers, body=row)
        except SupabaseHttpError as err:
            print(f"    x Row {i} failed (HTTP {err.status})")
            print(f"    Details : {json.dumps(err.details, indent=4)}")
            print(f"    Row data: {json.dumps(row, indent=4)}")
            raise


def _insert_upvotes(supabase_url: str, service_role_key: str, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    rest = _rest_base(supabase_url)
    headers = {**_auth_headers(service_role_key), "Prefer": "return=representation", "Accept": "application/json"}
    url = f"{rest}/upvotes"
    for i, row in enumerate(rows):
        try:
            _request_json("POST", url, headers, body=row)
        except SupabaseHttpError as err:
            print(f"    x Upvote row {i} failed (HTTP {err.status})")
            print(f"    Details : {json.dumps(err.details, indent=4)}")
            print(f"    Row data: {json.dumps(row, indent=4)}")
            raise


def _wait_for_profile(supabase_url: str, service_role_key: str, user_id: str, timeout_s: float = 10.0) -> dict[str, Any]:
    deadline = time.time() + timeout_s
    last = None
    while time.time() < deadline:
        last = _get_profile_by_user_id(supabase_url, service_role_key, user_id)
        if last:
            return last
        time.sleep(0.4)
    raise SupabaseHttpError("Timed out waiting for profile row", details={"user_id": user_id, "last": last})


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Seed Supabase with demo users, profiles, feedback, and upvotes.")
    parser.add_argument("--print-creds", action="store_true", help="Print demo login credentials at the end.")
    args = parser.parse_args(argv)

    _load_env_from_repo_root()

    supabase_url = _require_env("SUPABASE_URL", "VITE_SUPABASE_URL")
    service_role_key = _require_env("SUPABASE_SERVICE_ROLE_KEY")

    # 1) Ensure auth users exist
    print("Creating/verifying auth users...")
    auth_user_ids: dict[str, str] = {}
    for u in SEED_USERS:
        auth_user_ids[u.email] = _ensure_auth_user(supabase_url, service_role_key, u)
        print(f"  ✓ {u.display_name} ({u.email})")

    # 2) Ensure profiles exist (trigger), update display_name/team
    print("\nUpdating profiles...")
    profiles: dict[str, dict[str, Any]] = {}
    for u in SEED_USERS:
        user_id = auth_user_ids[u.email]
        profile = _wait_for_profile(supabase_url, service_role_key, user_id)
        _update_profile(supabase_url, service_role_key, user_id, u.display_name, u.team)
        profile = _get_profile_by_user_id(supabase_url, service_role_key, user_id) or profile
        profiles[u.email] = profile
        print(f"  ✓ {u.display_name} → team {u.team}")

    def pid(email: str) -> str:
        return str(profiles[email]["id"])

    # 3) Seed feedback
    # Feedback uses situation / behaviour / impact / optional (not content)
    print("\nSeeding feedback...")
    feedback_rows = [
        # Tania receives feedback
        {
            "author_id": pid("adrian@htx.gov.sg"),
            "recipient_id": pid("tania@htx.gov.sg"),
            "situation": "During the Q3 release cycle when the team was under pressure to ship.",
            "behaviour": "Tania proactively reviewed two PRs that were blocking the release, even though they weren't assigned to her.",
            "impact": "The release went out on time and the team avoided a stressful all-hands crunch.",
            "optional": "Really appreciated the initiative — it set a great example for the rest of us.",
            "is_anonymous": False,
        },
        {
            "author_id": pid("john@htx.gov.sg"),
            "recipient_id": pid("tania@htx.gov.sg"),
            "situation": "After the production incident last month.",
            "behaviour": "Tania wrote a clear and blameless postmortem with concrete follow-up action items.",
            "impact": "The team had a shared understanding of what went wrong and confidence that it wouldn't repeat.",
            "optional": None,
            "is_anonymous": True,
        },
        {
            "author_id": pid("jules@htx.gov.sg"),
            "recipient_id": pid("tania@htx.gov.sg"),
            "situation": "In the cross-team planning meeting for the new dashboard feature.",
            "behaviour": "Tania asked clarifying questions early and surfaced a dependency that would have caused a two-week delay.",
            "impact": "We were able to re-sequence the work and hit the milestone without a slip.",
            "optional": None,
            "is_anonymous": False,
        },
        # Adrian receives feedback
        {
            "author_id": pid("tania@htx.gov.sg"),
            "recipient_id": pid("adrian@htx.gov.sg"),
            "situation": "When onboarding the two new joiners in January.",
            "behaviour": "Adrian put together a structured onboarding guide and paired with each person for their first week.",
            "impact": "Both new teammates were productive within two weeks, which is faster than usual.",
            "optional": "This kind of mentoring lifts the whole team's velocity.",
            "is_anonymous": False,
        },
        {
            "author_id": pid("kevin.lim@htx.gov.sg"),
            "recipient_id": pid("adrian@htx.gov.sg"),
            "situation": "During the API performance investigation in February.",
            "behaviour": "Adrian dug into the profiling data independently and identified the N+1 query that was causing the slowdown.",
            "impact": "Response times dropped by 60% after the fix, which unblocked the mobile team.",
            "optional": None,
            "is_anonymous": False,
        },
        # John receives feedback
        {
            "author_id": pid("benjamin.lim@htx.gov.sg"),
            "recipient_id": pid("john@htx.gov.sg"),
            "situation": "During the sprint retrospective in March.",
            "behaviour": "John facilitated the retro in a way that gave everyone space to speak, including quieter team members.",
            "impact": "We surfaced two process issues we hadn't talked about before and agreed on fixes.",
            "optional": None,
            "is_anonymous": False,
        },
        # Jules receives feedback
        {
            "author_id": pid("yinyun@htx.gov.sg"),
            "recipient_id": pid("jules@htx.gov.sg"),
            "situation": "When I was stuck on a tricky CSS layout issue for two days.",
            "behaviour": "Jules sat with me for 30 minutes, asked good questions, and helped me see the problem differently.",
            "impact": "I solved it within the hour and learned a debugging approach I've used three times since.",
            "optional": "Really grateful for the patience.",
            "is_anonymous": False,
        },
        # Vince receives feedback
        {
            "author_id": pid("daniel.ong@htx.gov.sg"),
            "recipient_id": pid("vince@htx.gov.sg"),
            "situation": "During the data migration project in Q1.",
            "behaviour": "Vince caught a data integrity issue in the migration script during review before it ran in production.",
            "impact": "We avoided what could have been a serious data loss incident affecting thousands of records.",
            "optional": "Sharp eye for detail under time pressure.",
            "is_anonymous": False,
        },
        {
            "author_id": pid("ethan.goh@htx.gov.sg"),
            "recipient_id": pid("vince@htx.gov.sg"),
            "situation": "In our weekly syncs over the past quarter.",
            "behaviour": "Vince consistently comes prepared with status updates and flags risks early.",
            "impact": "Our team leads always have the information they need to make decisions without chasing anyone.",
            "optional": None,
            "is_anonymous": True,
        },
    ]

    # Omit keys with None values entirely (PostgREST treats missing keys as DEFAULT, which is cleaner than null)
    cleaned_feedback = [
        {k: v for k, v in row.items() if v is not None}
        for row in feedback_rows
    ]
    _insert_feedback(supabase_url, service_role_key, cleaned_feedback)
    print(f"  ✓ Inserted {len(cleaned_feedback)} feedback rows")

    # 4) Seed upvotes
    # Upvotes require a message (NOT NULL per schema migration)
    print("\nSeeding upvotes...")

    upvote_rows = [
        # Tania receives upvotes
        {"voter_id": pid("adrian@htx.gov.sg"),       "upvoted_id": pid("tania@htx.gov.sg"),    "message": "Always goes above and beyond to help the team ship."},
        {"voter_id": pid("john@htx.gov.sg"),          "upvoted_id": pid("tania@htx.gov.sg"),    "message": "Clear communicator under pressure."},
        {"voter_id": pid("jules@htx.gov.sg"),         "upvoted_id": pid("tania@htx.gov.sg"),    "message": "Great at spotting blockers early."},
        {"voter_id": pid("yinyun@htx.gov.sg"),        "upvoted_id": pid("tania@htx.gov.sg"),    "message": "Dependable and thorough."},
        # Adrian receives upvotes
        {"voter_id": pid("tania@htx.gov.sg"),         "upvoted_id": pid("adrian@htx.gov.sg"),   "message": "Excellent mentor — made the new joiners feel welcome."},
        {"voter_id": pid("john@htx.gov.sg"),          "upvoted_id": pid("adrian@htx.gov.sg"),   "message": "Deep technical knowledge shared generously."},
        {"voter_id": pid("kevin.lim@htx.gov.sg"),     "upvoted_id": pid("adrian@htx.gov.sg"),   "message": "Saved us weeks of pain with that perf fix."},
        # John receives upvotes
        {"voter_id": pid("tania@htx.gov.sg"),         "upvoted_id": pid("john@htx.gov.sg"),     "message": "Runs the best retros I've been part of."},
        {"voter_id": pid("benjamin.lim@htx.gov.sg"),  "upvoted_id": pid("john@htx.gov.sg"),     "message": "Makes everyone feel heard."},
        # Jules receives upvotes
        {"voter_id": pid("tania@htx.gov.sg"),         "upvoted_id": pid("jules@htx.gov.sg"),    "message": "Patient and insightful when helping others debug."},
        {"voter_id": pid("yinyun@htx.gov.sg"),        "upvoted_id": pid("jules@htx.gov.sg"),    "message": "Helped me grow more than anyone this quarter."},
        # Vince receives upvotes
        {"voter_id": pid("daniel.ong@htx.gov.sg"),    "upvoted_id": pid("vince@htx.gov.sg"),    "message": "Saved the data migration — sharp eye."},
        {"voter_id": pid("ethan.goh@htx.gov.sg"),     "upvoted_id": pid("vince@htx.gov.sg"),    "message": "Always prepared, never drops the ball."},
        {"voter_id": pid("felix.chua@htx.gov.sg"),    "upvoted_id": pid("vince@htx.gov.sg"),    "message": "Reliable and low drama. Great teammate."},
        # Some cross-team appreciation
        {"voter_id": pid("gabriel.koh@htx.gov.sg"),   "upvoted_id": pid("kevin.lim@htx.gov.sg"), "message": "Super helpful whenever I reach out cross-team."},
        {"voter_id": pid("henry.lee@htx.gov.sg"),     "upvoted_id": pid("michael.ong@htx.gov.sg"), "message": "Great technical documentation this sprint."},
        {"voter_id": pid("leon.ng@htx.gov.sg"),       "upvoted_id": pid("jason.tan@htx.gov.sg"),  "message": "Unblocked our team quickly during the integration work."},
        {"voter_id": pid("ryan.chua@htx.gov.sg"),     "upvoted_id": pid("nicholas.goh@htx.gov.sg"), "message": "Always willing to pair on hard problems."},
        {"voter_id": pid("aaron.tan@htx.gov.sg"),     "upvoted_id": pid("ivan.teo@htx.gov.sg"),   "message": "Solid code reviews with clear, actionable comments."},
        {"voter_id": pid("charles.ng@htx.gov.sg"),    "upvoted_id": pid("benjamin.lim@htx.gov.sg"), "message": "Great at breaking down complex problems in planning."},
    ]

    # Delete existing seed upvotes before re-inserting to avoid unique constraint errors
    _delete_seed_upvotes(
        supabase_url,
        service_role_key,
        [(r["voter_id"], r["upvoted_id"]) for r in upvote_rows],
    )
    _insert_upvotes(supabase_url, service_role_key, upvote_rows)
    print(f"  ✓ Inserted {len(upvote_rows)} upvote rows")

    print("\nSeed complete.")
    if args.print_creds:
        print("\nDemo logins (email / password):")
        for u in SEED_USERS:
            print(f"  - {u.email} / {u.password}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))