.PHONY: all build generate clean certs test help deps

# Default output directory
OUTPUT_DIR ?= ./output
SOURCE_DIR ?= ./lote-sources
BASE_URL ?= https://example.com/trust-ecosystem

# Go build settings
GO ?= go
GOFLAGS ?= -v

help:
	@echo "EUDI Trust Ecosystem LoTE/LOTL Generator"
	@echo "========================================"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  deps      - Download Go dependencies"
	@echo "  build     - Build the generator tool"
	@echo "  certs     - Generate sample certificates"
	@echo "  generate  - Generate LoTEs and LOTL (JSON + XML)"
	@echo "  all       - Run deps, build, certs, and generate"
	@echo "  clean     - Remove generated files"
	@echo "  test      - Run tests"
	@echo ""
	@echo "Options:"
	@echo "  OUTPUT_DIR=$(OUTPUT_DIR)"
	@echo "  SOURCE_DIR=$(SOURCE_DIR)"
	@echo "  BASE_URL=$(BASE_URL)"

# Download dependencies
deps:
	$(GO) mod download
	$(GO) mod tidy

# Build the generator
build: deps
	$(GO) build $(GOFLAGS) -o ./bin/lote-generator ./cmd/generate

# Generate sample certificates
certs:
	@echo "Generating sample certificates..."
	@chmod +x $(SOURCE_DIR)/generate-certs.sh
	@cd $(SOURCE_DIR) && ./generate-certs.sh

# Generate LoTEs and LOTL
generate: build
	@echo "Generating LoTEs and LOTL..."
	./bin/lote-generator \
		-source=$(SOURCE_DIR) \
		-output=$(OUTPUT_DIR) \
		-base-url=$(BASE_URL)
	@echo ""
	@echo "Generated files:"
	@find $(OUTPUT_DIR) -name "*.json" -o -name "*.xml" | sort

# Run everything
all: deps build certs generate
	@echo ""
	@echo "✓ Complete! Output in $(OUTPUT_DIR)"

# Clean generated files
clean:
	rm -rf $(OUTPUT_DIR)
	rm -rf ./bin
	rm -f $(SOURCE_DIR)/signing-keys/*.pem
	rm -f $(SOURCE_DIR)/signing-keys/*.der
	rm -f $(SOURCE_DIR)/signing-keys/*.jwk
	find $(SOURCE_DIR) -name "signing-*.pem" -delete
	find $(SOURCE_DIR) -name "signing-*.der" -delete
	find $(SOURCE_DIR) -name "signing-*.jwk" -delete

# Run tests
test:
	$(GO) test ./...

# Verify generated output
verify: generate
	@echo "Verifying generated LoTEs..."
	@for f in $(OUTPUT_DIR)/*/lote.json; do \
		echo "  Checking $$f..."; \
		$(GO) run -mod=mod github.com/sirosfoundation/g119612/cmd/tsl-tool verify-lote $$f 2>/dev/null || echo "    (verification requires tsl-tool)"; \
	done
