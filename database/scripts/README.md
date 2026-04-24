# Database Scripts

## PostgreSQL seed script

This script creates PostgreSQL tables equivalent to the current Supabase public schema and seeds demo data.

### Setup

1. Copy env file:
   cp .env.example .env
2. Ensure PostgreSQL is running:
   make up
3. Install script dependency:
   uv sync

### Run

uv run appraisal360-db-seed --print-creds

### Environment variables used

- POSTGRES_HOST (default: localhost)
- POSTGRES_PORT (default: 5432)
- POSTGRES_DB
- POSTGRES_USER
- POSTGRES_PASSWORD
