PYTHON ?= python

SERVICES := postgresql rustfs

.PHONY: all install sync $(SERVICES) stop stop-% restart restart-% status clean help seed seed-creds ensure-%-env

all: $(SERVICES)

install sync:
	uv sync

ensure-postgresql-env:
	test -f postgresql/.env || cp postgresql/.env.example postgresql/.env

ensure-rustfs-env:
	test -f rustfs/.env || cp rustfs/.env.example rustfs/.env

define START_SERVICE
$1: ensure-$1-env
	docker compose --env-file $1/.env -f $1/docker-compose.yml up -d
endef

$(foreach service,$(SERVICES),$(eval $(call START_SERVICE,$(service))))

stop:
	@for service in $(SERVICES); do \
		echo "Stopping $$service..."; \
		docker compose -f $$service/docker-compose.yml down -v; \
	done

stop-%:
	docker compose -f $*/docker-compose.yml down

restart: stop all

restart-%: stop-% %
	@echo "Restarted $*"

status:
	@for service in $(SERVICES); do \
		echo "=== $$service ==="; \
		docker compose -f $$service/docker-compose.yml ps; \
	done

clean:
	@for service in $(SERVICES); do \
		echo "Cleaning $$service..."; \
		docker compose -f $$service/docker-compose.yml down -v --remove-orphans; \
	done

seed:
	$(MAKE) -C ../backend seed

seed-creds:
	$(MAKE) -C ../backend seed-creds

help:
	@echo "Available targets:"
	@echo "  all           - Start all services ($(SERVICES))"
	@echo "  <service>     - Start a specific service"
	@echo "  stop          - Stop all services"
	@echo "  stop-<svc>    - Stop a specific service"
	@echo "  restart       - Restart all services"
	@echo "  restart-<svc> - Restart a specific service"
	@echo "  status        - Show status of all services"
	@echo "  clean         - Stop and remove all containers/volumes"
	@echo "  seed          - Seed PostgreSQL via the backend package"
	@echo "  seed-creds    - Print seed credentials via the backend package"
	@echo "  help          - Show this help message"
