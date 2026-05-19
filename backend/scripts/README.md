# Backend Scripts

This folder contains the local seed workflow for the backend package.

## Seed PostgreSQL

1. From the backend root, sync dependencies and prepare env files if needed:

```sh
cd ..
uv sync
cp .env.example .env
```

2. Make sure the scripts env file exists:

```sh
cp scripts/.env.example scripts/.env
```

3. Seed the database:

```sh
uv run python scripts/seed_postgresql.py
```

## Print seed credentials

```sh
uv run python scripts/seed_postgresql.py --print-creds
```

## Notes

- Run these commands from the backend root unless you adjust the paths.
- The seed script expects PostgreSQL to be available and configured through the backend env files.