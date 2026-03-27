TSL_TOOL     := ../g119612/tsl-tool
SIGNING_CERT := lote-signing-cert.pem
SIGNING_KEY  := lote-signing-key.pem
JWS_FILE     := output/lote-SE.json.jws
DECODED_FILE := output/lote-SE-signed-decoded.json

.PHONY: lote keys sign sign-keys clean-sign-keys decode-sign clean

# Build tsl-tool from g119612 if not present
$(TSL_TOOL):
	$(MAKE) -C ../g119612 tsl-tool

# Generate a test self-signed certificate for each entity (one-time setup)
keys:
	@for d in entities/*/; do \
		name=$$(basename $$d); \
		echo "Generating test cert for $$name..."; \
		openssl genrsa -out $$d/test_key.key 2048 2>/dev/null; \
		openssl req -new -x509 \
			-key $$d/test_key.key \
			-out $$d/test_cert.pem \
			-days 365 \
			-subj "/CN=$$name/O=WP4 Trust Group/C=EU" 2>/dev/null; \
	done
	@echo "Done. Test certificates written to each entity directory."

# Generate a signing key pair for the LoTE (one-time setup, also auto-run by sign)
$(SIGNING_CERT):
	openssl ecparam -genkey -name prime256v1 -noout -out $(SIGNING_KEY)
	openssl req -new -x509 \
		-key $(SIGNING_KEY) \
		-out $(SIGNING_CERT) \
		-days 365 \
		-subj "/CN=LoTE Signer/O=WP4 Trust Group/C=SE"
	@echo "Signing key pair written: $(SIGNING_CERT) $(SIGNING_KEY)"

sign-keys: clean-sign-keys $(SIGNING_CERT)

clean-sign-keys:
	rm -f $(SIGNING_CERT) $(SIGNING_KEY)

# Generate the LoTE (unsigned)
lote: $(TSL_TOOL)
	$(TSL_TOOL) pipeline.yaml

# Generate and JWS-sign the LoTE — produces lote-SE.json and lote-SE.json.jws
# Creates signing key pair automatically if not present
sign: $(TSL_TOOL) $(SIGNING_CERT)
	$(TSL_TOOL) pipeline-sign.yaml

# Decode the JWS payload from lote-SE.json.jws → lote-SE-signed-decoded.json
decode-sign:
	@python3 -c "\
import base64, json, sys; \
jws = open('$(JWS_FILE)').read().strip(); \
part = jws.split('.')[1]; \
part += '=' * (-len(part) % 4); \
payload = base64.urlsafe_b64decode(part); \
print(json.dumps(json.loads(payload), indent=2)) \
" > $(DECODED_FILE)
	@echo "Decoded payload written to $(DECODED_FILE)"

clean:
	rm -rf output/ entities/*/*.pem entities/*/*.key $(SIGNING_CERT) $(SIGNING_KEY)
