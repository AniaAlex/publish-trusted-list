VENV   := venv
PYTHON := $(VENV)/bin/python
PIP    := $(VENV)/bin/pip

.PHONY: lotl keys-xml keys-jades sign-xml sign-jades sign

lotl:
	python3 -m venv $(VENV)
	$(PIP) install --quiet --upgrade pip
	$(PIP) install --quiet lxml
	$(PYTHON) generate_test_lotl.py

# --- signing ---

keys-xml:
	bash signing_toolkit/xml_signing_toolkit/generate_test_keys.sh

keys-jades:
	bash signing_toolkit/jades_signing_toolkit/generate_test_keys.sh

sign-xml:
	$(PIP) install --quiet signxml lxml
	$(PYTHON) signing_toolkit/xml_signing_toolkit/sign_xml.py

sign-jades:
	$(PIP) install --quiet jwcrypto cryptography
	$(PYTHON) signing_toolkit/jades_signing_toolkit/sign_json.py

sign: sign-xml sign-jades
