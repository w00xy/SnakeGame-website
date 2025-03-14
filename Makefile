# Makefile for managing Docker containers

.PHONY: down build up

# Command to stop and remove containers
down:
	docker compose down

# Command to build the backend without cache
build:
	docker compose build --no-cache

# Command to start the containers in detached mode
up:
	docker compose up -d

# Command to rebuild and start the containers
restart: down build up