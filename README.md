# appraisal360

Project restructure is in progress.

Current direction:

- Frontend remains React + Vite + TypeScript
- Backend is FastAPI (Python)
- Database is PostgreSQL
- Profile image storage is RustFS (S3-compatible)

## New structure (scaffolded)

```text
frontend/
backend/
database/
```

## Local setup (first implementation slice)

1. Install frontend dependencies at repo root:

```sh
npm install
```

2. Prepare local env files:

```sh
cp database/.env.example database/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Start PostgreSQL and RustFS from the database package:

```sh
cd database
uv sync
cp .env.example .env
make up
make seed
```

4. Start frontend:

```sh
npm run dev
```

5. Start backend API:

```sh
cd backend
uv sync
cp .env.example .env
uv run appraisal360-backend dev
```

See [backend/README.md](backend/README.md) for the repo-local backend install and run commands.

## Service commands

- `npm run infra:up` start PostgreSQL and RustFS
- `npm run infra:down` stop services
- `npm run infra:logs` follow container logs
- `npm run infra:reset` stop and remove volumes

## Notes

- `supabase/` is still present for migration reference.
- Frontend source lives under [frontend/](frontend/).
- Backend now has its own local package, CLI entrypoint, and Makefile in [backend/](backend/).
- Database now has its own local package, CLI seed entrypoint, and Makefile in [database/](database/).
