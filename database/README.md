# Database

## Quick start

```sh
cd database
uv sync
cp .env.example .env
make up
make seed
```

## Repo-local commands

```sh
make install
make up
make down
make logs
make reset
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

- `docker-compose.yml` starts PostgreSQL and RustFS for local development.
- `appraisal360-db-seed` seeds the PostgreSQL schema and demo data from inside the database folder.
- PostgreSQL is the source of truth for relational data.
- RustFS (S3-compatible) stores profile images.
