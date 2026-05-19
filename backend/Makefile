PYTHON ?= python

.PHONY: install sync ensure-backend-env ensure-scripts-env dev serve seed seed-creds

install sync:
	uv sync

ensure-backend-env:
	test -f .env || cp .env.example .env

ensure-scripts-env:
	test -f scripts/.env || cp scripts/.env.example scripts/.env

dev:
	$(MAKE) ensure-backend-env
	uv run fastapi run src/main.py --reload

serve:
	$(MAKE) ensure-backend-env
	uv run fastapi run src/main.py

seed: ensure-scripts-env
	uv run python scripts/seed_postgresql.py

seed-creds: ensure-scripts-env
	uv run python scripts/seed_postgresql.py --print-creds