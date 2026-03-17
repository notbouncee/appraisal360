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
from typing import Any, Iterable


@dataclass(frozen=True)
class SeedUser:
    email: str
    password: str
    display_name: str
    team: str


SEED_USERS: list[SeedUser] = [
    SeedUser(
        email="tania@htx.gov.sg",
        password="password123",
        display_name="Tania Foo",
        team="Alpha",
    ),
    SeedUser(
        email="adrian@htx.gov.sg",
        password="password123",
        display_name="Adrian Tok",
        team="Alpha",
    ),
    SeedUser(
        email="john@htx.gov.sg",
        password="password123",
        display_name="John Zhang",
        team="Beta",
    ),
    SeedUser(
        email="jules@htx.gov.sg",
        password="password123",
        display_name="Jules Ang",
        team="Beta",
    ),
    SeedUser(
        email="yinyun@htx.gov.sg",
        password="password123",
        display_name="Tan Yin Yu",
        team="Alpha",
    ),
    SeedUser(
        email="vince@htx.gov.sg",
        password="password123",
        display_name="Vince Ong",
        team="Alpha",
    ),
    SeedUser(
    email="aaron.tan@htx.gov.sg",
    password="password123",
    display_name="Aaron Tan",
    team="Bravo",
),

SeedUser(
    email="benjamin.lim@htx.gov.sg",
    password="password123",
    display_name="Benjamin Lim",
    team="Alpha",
),

SeedUser(
    email="charles.ng@htx.gov.sg",
    password="password123",
    display_name="Charles Ng",
    team="Bravo",
),

SeedUser(
    email="daniel.ong@htx.gov.sg",
    password="password123",
    display_name="Daniel Ong",
    team="Alpha",
),

SeedUser(
    email="ethan.goh@htx.gov.sg",
    password="password123",
    display_name="Ethan Goh",
    team="Bravo",
),

SeedUser(
    email="felix.chua@htx.gov.sg",
    password="password123",
    display_name="Felix Chua",
    team="Alpha",
),

SeedUser(
    email="gabriel.koh@htx.gov.sg",
    password="password123",
    display_name="Gabriel Koh",
    team="Bravo",
),

SeedUser(
    email="henry.lee@htx.gov.sg",
    password="password123",
    display_name="Henry Lee",
    team="Bravo",
),

SeedUser(
    email="ivan.teo@htx.gov.sg",
    password="password123",
    display_name="Ivan Teo",
    team="Alpha",
),

SeedUser(
    email="jason.tan@htx.gov.sg",
    password="password123",
    display_name="Jason Tan",
    team="Alpha",
),

SeedUser(
    email="kevin.lim@htx.gov.sg",
    password="password123",
    display_name="Kevin Lim",
    team="Alpha",
),

SeedUser(
    email="leon.ng@htx.gov.sg",
    password="password123",
    display_name="Leon Ng",
    team="Bravo",
),

SeedUser(
    email="michael.ong@htx.gov.sg",
    password="password123",
    display_name="Michael Ong",
    team="Alpha",
),

SeedUser(
    email="nicholas.goh@htx.gov.sg",
    password="password123",
    display_name="Nicholas Goh",
    team="Bravo",
),

SeedUser(
    email="ryan.chua@htx.gov.sg",
    password="password123",
    display_name="Ryan Chua",
    team="Bravo",
),
]


class SupabaseHttpError(RuntimeError):
    def __init__(self, message: str, status: int | None = None, details: Any | None = None):
        super().__init__(message)
        self.status = status
        self.details = details


def _load_env_from_repo_root() -> None:
    """Best-effort load of appraisal360/.env (contains SUPABASE_URL but not service role)."""
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
    # Supabase expects BOTH apikey and Authorization for many endpoints.
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


def _ensure_auth_user(
    supabase_url: str,
    service_role_key: str,
    seed_user: SeedUser,
) -> str:
    """Create user if missing; return auth user id."""
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
    # Supabase returns the created user object (with id)
    if not isinstance(created, dict) or "id" not in created:
        raise SupabaseHttpError("Unexpected response creating user", details=created)
    return str(created["id"])


def _get_profile_by_user_id(supabase_url: str, service_role_key: str, user_id: str) -> dict[str, Any] | None:
    rest = _rest_base(supabase_url)
    headers = {
        **_auth_headers(service_role_key),
        "Accept": "application/json",
    }

    query = urllib.parse.urlencode({
        "select": "id,user_id,display_name,team",
        "user_id": f"eq.{user_id}",
    })
    url = f"{rest}/profiles?{query}"
    rows = _request_json("GET", url, headers)
    if isinstance(rows, list) and rows:
        return rows[0]
    return None


def _update_profile(supabase_url: str, service_role_key: str, user_id: str, display_name: str, team: str) -> None:
    rest = _rest_base(supabase_url)
    headers = {
        **_auth_headers(service_role_key),
        "Prefer": "return=representation",
        "Accept": "application/json",
    }

    query = urllib.parse.urlencode({"user_id": f"eq.{user_id}"})
    url = f"{rest}/profiles?{query}"
    _request_json(
        "PATCH",
        url,
        headers,
        body={"display_name": display_name, "team": team},
    )


def _delete_seed_feedback(supabase_url: str, service_role_key: str) -> None:
    rest = _rest_base(supabase_url)
    headers = {
        **_auth_headers(service_role_key),
        "Accept": "application/json",
    }

    # Remove previous seed feedback rows so re-running doesn't duplicate.
    # PostgREST filter: content=like.[seed]%
    pattern = "[seed]%"
    query = urllib.parse.urlencode({"content": f"like.{pattern}"})
    url = f"{rest}/feedback?{query}"
    _request_json("DELETE", url, headers)


def _insert_feedback(supabase_url: str, service_role_key: str, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return

    rest = _rest_base(supabase_url)
    headers = {
        **_auth_headers(service_role_key),
        "Prefer": "return=representation",
        "Accept": "application/json",
    }

    url = f"{rest}/feedback"
    try:
        _request_json("POST", url, headers, body=rows)
    except SupabaseHttpError as err:
        # Backward compatibility: if the column is not present yet, retry without it.
        details_text = json.dumps(err.details).lower() if err.details is not None else ""
        if "is_anonymous" in details_text:
            fallback_rows = [{k: v for k, v in row.items() if k != "is_anonymous"} for row in rows]
            _request_json("POST", url, headers, body=fallback_rows)
            return
        raise


def _upsert_upvotes(supabase_url: str, service_role_key: str, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return

    rest = _rest_base(supabase_url)
    headers = {
        **_auth_headers(service_role_key),
        "Prefer": "resolution=merge-duplicates,return=representation",
        "Accept": "application/json",
    }

    query = urllib.parse.urlencode({"on_conflict": "voter_id,upvoted_id"})
    url = f"{rest}/upvotes?{query}"
    _request_json("POST", url, headers, body=rows)


def _wait_for_profile(supabase_url: str, service_role_key: str, user_id: str, timeout_s: float = 10.0) -> dict[str, Any]:
    """Profile is created by trigger; poll briefly after user creation."""
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
    parser.add_argument(
        "--print-creds",
        action="store_true",
        help="Print demo login credentials at the end.",
    )
    args = parser.parse_args(argv)

    _load_env_from_repo_root()

    supabase_url = _require_env("SUPABASE_URL", "VITE_SUPABASE_URL")
    service_role_key = _require_env("SUPABASE_SERVICE_ROLE_KEY")

    # 1) Ensure auth users exist.
    auth_user_ids: dict[str, str] = {}
    for u in SEED_USERS:
        auth_user_ids[u.email] = _ensure_auth_user(supabase_url, service_role_key, u)

    # 2) Ensure profiles exist (trigger), update display_name/team.
    profiles: dict[str, dict[str, Any]] = {}
    for u in SEED_USERS:
        user_id = auth_user_ids[u.email]
        profile = _wait_for_profile(supabase_url, service_role_key, user_id)
        _update_profile(supabase_url, service_role_key, user_id, u.display_name, u.team)
        profile = _get_profile_by_user_id(supabase_url, service_role_key, user_id) or profile
        profiles[u.email] = profile

    # 3) Seed feedback/upvotes.
    # Delete old seed feedback so script is re-runnable without duplicates.
    _delete_seed_feedback(supabase_url, service_role_key)

    def pid(email: str) -> str:
        return str(profiles[email]["id"])

    feedback_rows = [
        {
            "author_id": pid("adrian@htx.gov.sg"),
            "recipient_id": pid("tania@htx.gov.sg"),
            "content": "[seed] Helped unblock PR review. Unblocked the release by reviewing quickly and suggesting clear fixes.",
            "is_anonymous": False,
        },
        {
            "author_id": pid("john@htx.gov.sg"),
            "recipient_id": pid("tania@htx.gov.sg"),
            "content": "[seed] Great incident write-up. The postmortem was concise and actionable; the follow-ups improved reliability.",
            "is_anonymous": True,
        },
        {
            "author_id": pid("tania@htx.gov.sg"),
            "recipient_id": pid("adrian@htx.gov.sg"),
            "content": "[seed] Strong mentoring. Helped onboard a new teammate and improved team velocity.",
            "is_anonymous": False,
        },
    ]

    upvote_rows = [
        # Votes received by tania
        {"voter_id": pid("adrian@htx.gov.sg"), "upvoted_id": pid("tania@htx.gov.sg")},
        {"voter_id": pid("john@htx.gov.sg"), "upvoted_id": pid("tania@htx.gov.sg")},
        # Some votes cast by tania so she sees votes-left < 5
        {"voter_id": pid("tania@htx.gov.sg"), "upvoted_id": pid("adrian@htx.gov.sg")},
        {"voter_id": pid("tania@htx.gov.sg"), "upvoted_id": pid("john@htx.gov.sg")},
    ]

    _insert_feedback(supabase_url, service_role_key, feedback_rows)
    _upsert_upvotes(supabase_url, service_role_key, upvote_rows)

    print("Seed complete.")
    if args.print_creds:
        print("\nDemo logins (email / password):")
        for u in SEED_USERS:
            print(f"- {u.email} / {u.password}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))