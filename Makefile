.PHONY: help install install-client install-server dev-client dev-server dev build-client test-server

help:
	@echo "Available commands:"
	@echo "  make install         - Install client and server dependencies"
	@echo "  make install-client  - Install client dependencies"
	@echo "  make install-server  - Install server dependencies"
	@echo "  make dev-client      - Run Vite client on localhost"
	@echo "  make dev-server      - Run Node server in dev mode"
	@echo "  make dev             - Run server and client together"
	@echo "  make build-client    - Build client for production"
	@echo "  make test-server     - Run server tests"

install: install-server install-client

install-client:
	cd client && npm install

install-server:
	cd server && npm install

dev-client:
	cd client && npm run dev

dev-server:
	cd server && npm run dev

dev:
	@set -e; \
	trap 'kill 0' INT TERM EXIT; \
	(cd server && npm run dev) & \
	(cd client && npm run dev) & \
	wait

build-client:
	cd client && npm run build

test-server:
	cd server && npm test
