PYTHON ?= python

.PHONY: install sync up down logs reset seed seed-creds

install sync:
	uv sync

up:
	docker compose --env-file .env -f docker-compose.yml up -d

down:
	docker compose --env-file .env -f docker-compose.yml down

logs:
	docker compose --env-file .env -f docker-compose.yml logs -f

reset:
	docker compose --env-file .env -f docker-compose.yml down -v --remove-orphans

seed:
	uv run appraisal360-db-seed

seed-creds:
	uv run appraisal360-db-seed --print-creds
