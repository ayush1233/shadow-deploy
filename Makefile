# Force bash shell for consistent behavior on Windows (Git Bash) and Unix
SHELL := bash

.PHONY: help setup dev start stop restart logs test clean health build status db-migrate configure shadow logs-api logs-ai logs-comparison logs-ingestion

# Default target
help: ## Show this help message
	@echo "Shadow Deploy Platform - Available Commands"
	@echo "============================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

setup: ## Run interactive setup wizard
ifeq ($(OS),Windows_NT)
	@powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
else
	@bash scripts/setup.sh
endif

dev: ## Start dashboard in dev mode (hot reload)
	cd dashboard && npm install && npm run dev

start: ## Start all services via Docker Compose
	docker-compose up -d --build

stop: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose down
	docker-compose up -d --build

logs: ## Tail logs from all services
	docker-compose logs -f --tail=100

logs-api: ## Tail API service logs
	docker-compose logs -f api-service

logs-ai: ## Tail AI service logs
	docker-compose logs -f ai-service

logs-comparison: ## Tail comparison engine logs
	docker-compose logs -f comparison-engine

logs-ingestion: ## Tail ingestion service logs
	docker-compose logs -f ingestion-service

test: ## Run end-to-end platform test
ifeq ($(OS),Windows_NT)
	@powershell -ExecutionPolicy Bypass -File scripts/test-platform.ps1
else
	@bash scripts/test-platform.sh
endif

health: ## Check health of all services
	@python cli/healthcheck.py

clean: ## Remove all containers, volumes, and build artifacts
	docker-compose down -v --remove-orphans
	-rm -rf dashboard/node_modules dashboard/dist
	@echo "Cleaned up successfully"

build: ## Build all Docker images without starting
	docker-compose build

status: ## Show running containers and their ports
	@docker-compose ps

db-migrate: ## Print instructions to run Supabase schema migration
	@echo "Copy the contents of dashboard/supabase-schema.sql"
	@echo "Go to Supabase Dashboard -> SQL Editor -> New Query -> Paste -> Run"

configure: ## Configure NGINX via natural language (usage: make configure PROMPT="...")
	@python cli/configure-proxy.py "$(PROMPT)"

shadow: ## Start shadow testing (usage: make shadow PROD_PORT=3000 SHADOW_PORT=4000 SHADOW_DIR=path/to/v2)
ifeq ($(OS),Windows_NT)
	@powershell -ExecutionPolicy Bypass -File cli/start-shadow.ps1 -ProdPort $(or $(PROD_PORT),3000) -ShadowPort $(or $(SHADOW_PORT),4000) $(if $(SHADOW_DIR),-ShadowAppDir "$(SHADOW_DIR)")
else
	@bash cli/start-shadow.sh -p $(or $(PROD_PORT),3000) -s $(or $(SHADOW_PORT),4000) $(if $(SHADOW_DIR),-d "$(SHADOW_DIR)")
endif
