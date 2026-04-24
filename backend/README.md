# Backend (FastAPI)

## Quick start

1. Create and activate a virtual environment.
2. Sync dependencies and install the backend package:
   uv sync
3. Copy env template:
   cp .env.example .env
4. Run the API:
   uv run appraisal360-backend dev

## Repo-local commands

```sh
make install
make dev
make serve
```

## Alternative install

If you prefer pip over uv, you can still use:

```sh
python -m pip install -r requirements.txt
```

If you want to refresh the lockfile on a new machine, run:

```sh
uv lock
```

## Notes

- PostgreSQL is the source of truth for relational data.
- RustFS (S3-compatible) stores profile images.
