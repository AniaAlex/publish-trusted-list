VENV   := .venv
PYTHON := $(VENV)/bin/python
PIP    := $(VENV)/bin/pip

TL_ENTRIES_DIR := tl_entries
CERTS_DIR      := certs
OUTPUT_DIR     := output

.PHONY: all setup certs generate clean

all: setup certs generate

setup:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip -q
	$(PIP) install -r requirements.txt -q
	@echo "Dependencies installed."

certs: setup
	$(PYTHON) -m lotl_xml_tool.create_signing_cert \
		--output-dir $(CERTS_DIR) \
		--scheme-territory EU \
		--scheme-operator-name "WE BUILD WP4 Trust Group"
	@echo "Signing cert and key written to $(CERTS_DIR)/"

generate: setup
	$(PYTHON) generate_lotl.py \
		--tl-entries-dir $(TL_ENTRIES_DIR) \
		--output-dir $(OUTPUT_DIR) \
		--signing-key $(CERTS_DIR)/lotl_signing_key.pem \
		--signing-cert $(CERTS_DIR)/lotl_signing_cert.pem
	@echo "LOTL written to $(OUTPUT_DIR)/"

generate-unsigned: setup
	$(PYTHON) generate_lotl.py \
		--tl-entries-dir $(TL_ENTRIES_DIR) \
		--output-dir $(OUTPUT_DIR)
	@echo "Unsigned LOTL written to $(OUTPUT_DIR)/"

clean:
	rm -rf $(OUTPUT_DIR)/*.xml $(OUTPUT_DIR)/*.json $(CERTS_DIR)/*.pem
