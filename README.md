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

1. Install frontend dependencies inside the frontend package:

```sh
cd frontend
npm install
```

2. Prepare local env files:

```sh
cp database/postgresql/.env.example database/postgresql/.env
cp database/rustfs/.env.example database/rustfs/.env
cp backend/.env.example backend/.env
cp backend/scripts/.env.example backend/scripts/.env
cp frontend/.env.example frontend/.env
```

3. Start PostgreSQL and RustFS from the database package:

```sh
cd database
uv sync
cp postgresql/.env.example postgresql/.env
cp rustfs/.env.example rustfs/.env
make all
make seed
```

4. Start frontend:

```sh
cd frontend
npm run dev
```

5. Start backend API:

```sh
cd backend
uv sync
cp .env.example .env
cp scripts/.env.example scripts/.env
uv run fastapi run src/main.py --reload
```

See [backend/README.md](backend/README.md) for the repo-local backend install and run commands.

## Service commands

- `cd database && make all` start PostgreSQL and RustFS
- `cd database && make stop` stop services
- `cd database && make restart` restart services
- `cd database && make status` show service status
- `cd database && make clean` stop and remove containers and volumes
- `cd database && make seed` seed PostgreSQL
- `cd database && make seed-creds` print seed credentials

## Notes

- `supabase/` is still present for migration reference.
- Frontend source lives under [frontend/](frontend/).
- Backend now has its own local package and a Makefile in [backend/](backend/).
- Database now has its own local package and Makefile in [database/](database/); its seed flow runs from the backend package via `uv run python scripts/seed_postgresql.py`.
