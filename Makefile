# Force bash shell for consistent behavior on Windows (Git Bash) and Unix
SHELL := bash

.PHONY: help setup dev start stop restart logs test clean health build status db-migrate configure logs-api logs-ai logs-comparison logs-ingestion

# Default target
help: ## Show this help message
	@echo "Shadow Deploy Platform - Available Commands"
	@echo "============================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

setup: ## Run interactive setup wizard
	@bash setup.sh

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
	@echo "Running platform tests..."
	python cli/demo.py

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
