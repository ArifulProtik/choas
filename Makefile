
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
CYAN   := $(shell tput -Txterm setaf 6)
RESET  := $(shell tput -Txterm sgr0)

all: help

## Build:
build: ## Build your project and put the output binary in out/bin/
	docker-compose build
## Run
run:## Run Runs your project
	docker-compose up
## Dev
dev: ## Runs The app with hot reload in a Docker container
	docker-compose up --build
## Vendor
vendor: ## Copy of all packages needed to support builds and tests in the vendor directory
	go mod vendor
## gen
gen: ## Generate codes for ent schems
	ent generate ./internal/ent/schema
## schema
schema: ## creates a new Ent Schema like : make schema S=<Your Schema Name>
	ent new --target internal/ent/schema ${S}
## Help:
help: ## Show this help.
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} { \
		if (/^[a-zA-Z_-]+:.*?##.*$$/) {printf "    ${YELLOW}%-20s${GREEN}%s${RESET}\n", $$1, $$2} \
		else if (/^## .*$$/) {printf "  ${CYAN}%s${RESET}\n", substr($$1,4)} \
		}' $(MAKEFILE_LIST)
