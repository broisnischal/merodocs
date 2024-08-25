# Makefile for Docker commands

# Variables
DOCKER_COMPOSE = docker compose
DOCKER = docker

# Default target
.DEFAULT_GOAL := help

# Help target
help:
	@echo "Available commands:"
	@echo "  make build-dev    : Build the development Docker image"
	@echo "  make build-prod   : Build the production Docker image"
	@echo "  make run-dev      : Run the development container"
	@echo "  make run-prod     : Run the production container"
	@echo "  make stop         : Stop all running containers"
	@echo "  make clean        : Remove all stopped containers, unused networks, and dangling images"
	@echo "  make logs         : View logs of running containers"
	@echo "  make shell-dev    : Open a shell in the development container"
	@echo "  make shell-prod   : Open a shell in the production container"
	@echo "  make cli-dev      : Enter the CLI of the development container"
	@echo "  make cli-prod     : Enter the CLI of the production container"
	@echo "  make test         : Run tests in the development container"
	@echo "  make lint         : Run linter in the development container"

# Build commands
build-dev:
	$(DOCKER_COMPOSE) build dev

build-prod:
	$(DOCKER_COMPOSE) build prod 

# Run commands
run-dev:
	$(DOCKER_COMPOSE) up -d dev

run-prod:
	$(DOCKER_COMPOSE) up -d prod 

# Stop command
stop-dev:
	$(DOCKER_COMPOSE) down dev

stop-prod:
	$(DOCKER_COMPOSE) down prod

# Clean command
clean:
	$(DOCKER) system prune  -f
# --filter "until=2h"
clean-unused:
	$(DOCKER) volume prune -f

clean-old-cache:
	$(DOCKER) builder prune --filter "until=2h" --keep-storage 4GB

clean-all:
	$(DOCKER) system prune -a -f --volumes

# Logs command
logs:
	$(DOCKER_COMPOSE) logs -f

# Shell commands
shell-dev:
	$(DOCKER_COMPOSE) exec dev sh

shell-prod:
	$(DOCKER_COMPOSE) exec prod sh

# Terminal access commands
cli-dev:
	$(DOCKER) exec -it dev

cli-prod:
	$(DOCKER) exec -it $$($(DOCKER_COMPOSE) ps -q prod) /bin/bash

# Test command
test:
	$(DOCKER_COMPOSE) run --rm dev npm test

# Lint command
lint:
	$(DOCKER_COMPOSE) run --rm dev npm run lint

# Declare phony targets
.PHONY: help build-dev build-prod run-dev run-prod stop clean logs shell-dev shell-prod test lint