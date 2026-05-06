.PHONY: run
run: ## Build and start Pocketbase
	@docker-compose build
	@docker-compose up -d
	@echo "Pocketbase running at http://localhost:$$(grep '^PB_PORT' .env 2>/dev/null | cut -d= -f2 | tr -d '[:space:]' || echo 8090)/_/"

.PHONY: stop
stop: ## Stop containers (data preserved)
	@docker-compose down

.PHONY: logs
logs: ## Tail Pocketbase logs
	@docker-compose logs -f pocketbase

.PHONY: shell
shell: ## Shell into the Pocketbase container
	@docker-compose exec pocketbase sh

.PHONY: migrate
migrate: ## Re-apply pending migrations
	@docker-compose exec pocketbase ./pocketbase migrate up --dir=/pb/pb_data --migrationsDir=/pb/pb_migrations

.PHONY: createsuperuser
createsuperuser: ## Create admin from .env (PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD)
	@set -a; . ./.env; set +a; \
	docker-compose exec pocketbase ./pocketbase admin create "$$PB_ADMIN_EMAIL" "$$PB_ADMIN_PASSWORD" --dir=/pb/pb_data

.PHONY: admin
admin: ## Create admin with explicit args: make admin email=foo@bar pass=secret
	@docker-compose exec pocketbase ./pocketbase admin create "$(email)" "$(pass)" --dir=/pb/pb_data

.PHONY: admin-update
admin-update: ## Reset admin password: make admin-update email=foo@bar pass=newsecret
	@docker-compose exec pocketbase ./pocketbase admin update "$(email)" "$(pass)" --dir=/pb/pb_data

.PHONY: clean
clean: ## Stop and WIPE the database volume
	@docker-compose down -v
	@echo "Database volume removed."

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
