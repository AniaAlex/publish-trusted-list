TSL_TOOL     := ../../g119612/tsl-tool
SIGNING_CERT := lote-signing-cert.pem
SIGNING_KEY  := lote-signing-key.pem
JWS_FILE     := output/lote-SE.json.jws
DECODED_FILE := output/lote-SE-signed-decoded.json

TSL_SIGNING_CERT := tsl-signing-cert.pem
TSL_SIGNING_KEY  := tsl-signing-key.pem

.PHONY: lote keys sign sign-keys clean-sign-keys decode-sign clean keys-xml lote-xml sign-xml tsl-sign-keys

$(TSL_TOOL):
	$(MAKE) -C ../../g119612 tsl-tool

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

lote: $(TSL_TOOL)
	$(TSL_TOOL) pipeline.yaml

sign: $(TSL_TOOL) $(SIGNING_CERT)
	$(TSL_TOOL) pipeline-sign.yaml

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

keys-xml:
	@for d in providers/*/; do \
		name=$$(basename $$d); \
		echo "Generating XML cert for $$name..."; \
		openssl genrsa -out $$d/cert.key 2048 2>/dev/null; \
		openssl req -new -x509 \
			-key $$d/cert.key \
			-outform DER \
			-out $$d/cert.pem \
			-days 365 \
			-subj "/CN=$$name/O=WP4 Trust Group/C=EU" 2>/dev/null; \
	done
	@echo "Done. XML provider certs written."

lote-xml: $(TSL_TOOL)
	$(TSL_TOOL) pipeline-xml.yaml

$(TSL_SIGNING_CERT):
	openssl genrsa -out $(TSL_SIGNING_KEY) 2048
	openssl req -new -x509 \
		-key $(TSL_SIGNING_KEY) \
		-out $(TSL_SIGNING_CERT) \
		-days 365 \
		-subj "/CN=TSL XML Signer/O=WP4 Trust Group/C=SE"
	@echo "XML signing key pair written: $(TSL_SIGNING_CERT) $(TSL_SIGNING_KEY)"

tsl-sign-keys: $(TSL_SIGNING_CERT)

sign-xml: $(TSL_TOOL) $(TSL_SIGNING_CERT)
	$(TSL_TOOL) pipeline-xml-sign.yaml

clean:
	rm -rf output/ entities/*/*.pem entities/*/*.key providers/*/*.pem providers/*/*.key $(SIGNING_CERT) $(SIGNING_KEY)
