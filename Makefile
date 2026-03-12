BUCKET := downloads-weiensong-top
PREFIX := downloads
META_FILE ?= ./r2-meta.example.json
FILE ?=

.PHONY: upload meta deploy

upload:
ifndef FILE
	$(error Usage: make upload FILE=./your-file.zip)
endif
	@FILE_PATH='$(FILE)'; \
	case "$$FILE_PATH" in \
		~/*) FILE_PATH="$$HOME/$${FILE_PATH#~/}" ;; \
	esac; \
	FILE_NAME="$$(basename "$$FILE_PATH")"; \
	XDG_CONFIG_HOME=./.wrangler-config npx wrangler r2 object put \
		"$(BUCKET)/$(PREFIX)/$$FILE_NAME" \
		--file "$$FILE_PATH" \
		--remote

meta:
	XDG_CONFIG_HOME=./.wrangler-config npx wrangler r2 object put \
		"$(BUCKET)/$(PREFIX)/_meta.json" \
		--file "$(META_FILE)" \
		--remote

deploy:
	npm run deploy
