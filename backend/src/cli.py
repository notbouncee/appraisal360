from __future__ import annotations

import argparse
import subprocess
import sys


def _run_uvicorn(reload: bool) -> int:
    command = [
        sys.executable,
        "-m",
        "uvicorn",
        "src.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
    ]
    if reload:
        command.append("--reload")

    completed = subprocess.run(command, check=False)
    return completed.returncode


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="appraisal360-backend")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("dev", help="Run the backend in reload mode")
    subparsers.add_parser("serve", help="Run the backend without reload")

    args = parser.parse_args(argv)

    if args.command == "dev":
        return _run_uvicorn(reload=True)

    if args.command == "serve":
        return _run_uvicorn(reload=False)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
