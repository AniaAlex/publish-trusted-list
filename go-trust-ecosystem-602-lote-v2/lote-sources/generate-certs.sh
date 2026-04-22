#!/bin/bash
# Script to generate sample EC P-256 certificates for testing
# These are for demonstration purposes only - use real PKI in production

set -e

CERT_DIR="$(dirname "$0")"
cd "$CERT_DIR"

echo "Generating sample certificates for testing..."

# Function to generate a self-signed EC P-256 certificate
generate_cert() {
    local name="$1"
    local cn="$2"
    local output_dir="$3"
    
    mkdir -p "$output_dir"
    
    # Generate EC P-256 private key
    openssl ecparam -name prime256v1 -genkey -noout -out "$output_dir/${name}-key.pem" 2>/dev/null
    
    # Generate self-signed certificate
    openssl req -new -x509 -key "$output_dir/${name}-key.pem" \
        -out "$output_dir/${name}-cert.pem" \
        -days 365 \
        -subj "/CN=${cn}/O=EUDI Trust Ecosystem/C=EU" \
        2>/dev/null
    
    # Convert to DER for TSL compatibility  
    openssl x509 -in "$output_dir/${name}-cert.pem" -outform DER -out "$output_dir/${name}-cert.der"
    
    # Generate JWK from the private key
    cat > "$output_dir/${name}-key.jwk" << EOF
{
  "kty": "EC",
  "crv": "P-256",
  "use": "sig",
  "kid": "${name}-key-001"
}
EOF
    
    echo "  Generated: $name"
}

# Generate signing key for LOTL
echo "Generating LOTL signing certificate..."
generate_cert "lotl-signing" "EUDI LOTL Signing Authority" "../signing-keys"

# Generate certificates for each entity type
echo "Generating entity certificates..."

# PID Provider
generate_cert "signing" "Example Government PID Issuer" "pid-providers/entities/example-pid-issuer"

# LPID Provider  
generate_cert "signing" "Example Business Registry LPID Issuer" "lpid-providers/entities/example-lpid-issuer"

# QEAA Provider
generate_cert "signing" "Example QEAA Trust Service Provider" "qeaa-providers/entities/example-qeaa-issuer"

# EAA Provider
generate_cert "signing" "Example University EAA Issuer" "eaa-providers/entities/example-eaa-issuer"

# Pub-EAA Provider
generate_cert "signing" "Example Tax Authority Pub-EAA Issuer" "pub-eaa-providers/entities/example-pub-eaa-issuer"

# Natural Person Wallet Provider
generate_cert "signing" "Example NP Wallet Provider" "wallet-providers-np/entities/example-npwp"

# Legal Person Wallet Provider
generate_cert "signing" "Example LP Wallet Provider" "wallet-providers-lp/entities/example-lpwp"

# QES Provider
generate_cert "signing" "Example QES Certificate Provider" "qes-providers/entities/example-qes-provider"

# Relying Party
generate_cert "signing" "Example Verifier Service" "relying-parties/entities/example-verifier"

echo ""
echo "Certificate generation complete!"
echo "Note: These are self-signed test certificates. Use proper PKI for production."
