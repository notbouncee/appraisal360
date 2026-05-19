# Backend (FastAPI)

## Quick start

1. Create and activate a virtual environment.
2. Sync dependencies and install the backend package:
   uv sync
3. Copy env template:
   cp .env.example .env
   cp scripts/.env.example scripts/.env
4. Run the API:
   uv run fastapi run src/main.py --reload

## Seed PostgreSQL

```sh
make seed
```

## Repo-local commands

```sh
make install
uv run fastapi run src/main.py --reload
make serve
make seed
make seed-creds
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

The backend app can also be run directly with:

```sh
uv run fastapi run src/main.py --reload
```

The seed module can also be run directly with:

```sh
uv run python scripts/seed_postgresql.py --print-creds
```

## Notes

- PostgreSQL is the source of truth for relational data.
- RustFS (S3-compatible) stores profile images.
