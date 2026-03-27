#!/usr/bin/env bash
# Generate a test RSA private key and self-signed certificate for XAdES signing.
# Output files are written to the same directory as this script.

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Generating RSA-2048 private key..."
openssl genrsa -out "$DIR/test_private_key.pem" 2048

echo "Generating self-signed X.509 certificate..."
openssl req -new -x509 \
  -key "$DIR/test_private_key.pem" \
  -out "$DIR/test_cert.pem" \
  -days 365 \
  -subj "/CN=Test LoTL XAdES Signer/O=WP4 Trust Group/C=EU"

echo "Extracting public key..."
openssl rsa -in "$DIR/test_private_key.pem" -pubout -out "$DIR/test_public_key.pem"

echo ""
echo "Done. Files created in $DIR:"
echo "  test_private_key.pem  — RSA private key  (keep secret)"
echo "  test_public_key.pem   — RSA public key"
echo "  test_cert.pem         — self-signed X.509 certificate"
