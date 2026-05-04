# Database

## Quick start

```sh
cd database
uv sync
cp postgresql/.env.example postgresql/.env
cp rustfs/.env.example rustfs/.env
make all
make seed
```

## Repo-local commands

```sh
make install
make all
make stop
make restart
make status
make clean
make seed
make seed-creds
```

## Alternative install

```sh
python -m pip install -r requirements.txt
```

If you want to refresh the lockfile on a new machine, run:

```sh
uv lock
```

## Notes

- `postgresql/docker-compose.yml` starts PostgreSQL for local development.
- `rustfs/docker-compose.yml` starts RustFS for local development.
- `postgresql/.env` and `rustfs/.env` hold the service-specific local environment values.
- `make seed` delegates to [backend](../backend), which runs the seed script with `uv run python scripts/seed_postgresql.py`.
- PostgreSQL is the source of truth for relational data.
- RustFS (S3-compatible) stores profile images.
