# EUDI Trust Ecosystem - LoTE & LOTL Generator

This project provides a complete setup for generating **Lists of Trusted Entities (LoTE)** and **List of Trusted Lists (LOTL)** for the EUDI (European Digital Identity) Trust Ecosystem in both **JSON** (ETSI TS 119 602) and **XML** (ETSI TS 119 612) formats.

## Overview

The EUDI Trust Ecosystem uses trust lists to verify the authorization and authenticity of various entity types participating in the digital identity infrastructure. This project generates trust lists for all major entity types defined in the eIDAS 2.0 framework and EWC RFC 012.

## Entity Types Supported

| Entity Type | Service Type URI | Description |
|-------------|------------------|-------------|
| **PID Provider** | `https://ewc-consortium.github.io/.../PID` | Personal Identification Document issuers |
| **LPID Provider** | `https://ewc-consortium.github.io/.../LPID` | Legal Person Identification Document issuers |
| **QEAA Provider** | `http://uri.etsi.org/TrstSvc/Svctype/EAA/Q` | Qualified Electronic Attestation of Attributes |
| **EAA Provider** | `http://uri.etsi.org/TrstSvc/Svctype/EAA` | Electronic Attestation of Attributes (non-qualified) |
| **Pub-EAA Provider** | `http://uri.etsi.org/TrstSvc/Svctype/EAA/Pub-EAA` | Public Body EAA providers |
| **NP Wallet Provider** | `https://ewc-consortium.github.io/.../NPWP` | Natural Person Wallet Providers |
| **LP Wallet Provider** | `https://ewc-consortium.github.io/.../LPWP` | Legal Person Wallet Providers |
| **QES Provider** | `http://uri.etsi.org/TrstSvc/Svctype/CA/QC` | Qualified Electronic Signature certificate issuers |
| **Relying Party** | `http://uri.etsi.org/.../EUgeneric` | Verifiers/credential requesters |

## Project Structure

```
go-trust-ecosystem-602-lote-v2/
├── cmd/
│   └── generate/           # LoTE/LOTL generator tool
│       ├── main.go
│       └── types.go
├── lote-sources/           # Source configurations
│   ├── lotl/               # Master LOTL configuration
│   │   └── scheme.yaml
│   ├── pid-providers/      # PID providers LoTE
│   │   ├── scheme.yaml
│   │   └── entities/
│   │       └── example-pid-issuer/
│   │           └── entity.yaml
│   ├── lpid-providers/     # LPID providers LoTE
│   ├── qeaa-providers/     # QEAA providers LoTE
│   ├── eaa-providers/      # EAA providers LoTE
│   ├── pub-eaa-providers/  # Pub-EAA providers LoTE
│   ├── wallet-providers-np/# NP Wallet providers LoTE
│   ├── wallet-providers-lp/# LP Wallet providers LoTE
│   ├── qes-providers/      # QES providers LoTE
│   ├── relying-parties/    # Relying Parties LoTE
│   └── generate-certs.sh   # Certificate generation script
├── output/                 # Generated LoTEs and LOTL
├── pipeline-generate-lotes.yaml         # tsl-tool pipeline
├── pipeline-generate-signed-lotes.yaml  # Signed LoTE pipeline
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

## Prerequisites

- **Go 1.26+** (required by g119612 library)
- **OpenSSL** (for certificate generation)
- **Make** (optional, for convenience)

## Quick Start

### 1. Generate Everything

```bash
make all
```

This will:
1. Download Go dependencies
2. Build the generator tool
3. Generate sample certificates
4. Generate LoTEs and LOTL in JSON and XML formats

### 2. Manual Steps

```bash
# Download dependencies
go mod download

# Build the generator
go build -o ./bin/lote-generator ./cmd/generate

# Generate sample certificates (optional)
chmod +x ./lote-sources/generate-certs.sh
./lote-sources/generate-certs.sh

# Generate LoTEs and LOTL
./bin/lote-generator -source=./lote-sources -output=./output -base-url=https://your-domain.com/trust
```

## Output Files

After generation, you'll find:

```
output/
├── lotl.json              # Master LOTL (JSON - TS 119 602)
├── lotl.xml               # Master LOTL (XML - TS 119 612)
├── pid-providers/
│   ├── lote.json          # PID Providers LoTE (JSON)
│   └── lote.xml           # PID Providers LoTE (XML)
├── lpid-providers/
│   ├── lote.json
│   └── lote.xml
├── qeaa-providers/
│   ├── lote.json
│   └── lote.xml
... (and so on for each entity type)
```

## Configuration

### Adding a New Entity

1. Create a new directory under the appropriate entity type:
   ```
   lote-sources/<entity-type>/entities/<entity-name>/
   ```

2. Create an `entity.yaml` file:
   ```yaml
   entityId: "https://your-entity.example.com/eudi"
   entityType: "http://uri.etsi.org/TrstSvc/Svctype/EAA"
   names:
     - language: en
       value: "Your Entity Name"
   status: "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/granted"
   informationURIs:
     - language: en
       uri: "https://your-entity.example.com/info"
   services:
     - serviceType: "http://uri.etsi.org/TrstSvc/Svctype/EAA"
       serviceNames:
         - language: en
           value: "Your Service Name"
       status: "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/granted"
       serviceSupplyPoints:
         - "https://your-entity.example.com/oidc4vci"
   ```

3. Add digital identity files (optional):
   - `signing-cert.pem` - X.509 certificate (PEM format)
   - `signing-key.jwk` - JWK public key
   - `identity.did` - DID identifier

4. Regenerate:
   ```bash
   make generate
   ```

### Customizing the Base URL

```bash
make generate BASE_URL=https://trust.your-domain.eu
```

### Creating a New Entity Type

1. Create a new directory: `lote-sources/<new-entity-type>/`
2. Add a `scheme.yaml` with the scheme metadata
3. Add the entity type to the `entityTypes` slice in `cmd/generate/main.go`
4. Update the LOTL scheme in `lote-sources/lotl/scheme.yaml`

## Using with tsl-tool

The [sirosfoundation/g119612](https://github.com/sirosfoundation/g119612) library provides the `tsl-tool` CLI for pipeline processing:

```bash
# Install tsl-tool
go install github.com/sirosfoundation/g119612/cmd/tsl-tool@latest

# Generate unsigned LoTEs
tsl-tool pipeline-generate-lotes.yaml

# Generate signed LoTEs (requires certificates)
tsl-tool pipeline-generate-signed-lotes.yaml
```

## Standards Reference

- **ETSI TS 119 612** - Trust Status Lists (XML format)
- **ETSI TS 119 602** - Lists of Trusted Entities (JSON format)
- **eIDAS 2.0** - European Digital Identity regulation
- **EWC RFC 012** - Trust Mechanism specification

## Service Status Values

| Status | URI |
|--------|-----|
| Granted | `http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/granted` |
| Withdrawn | `http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/withdrawn` |
| Recognized at National Level | `http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/recognisedatnationallevel` |

## License

This project is licensed under the BSD 2-Clause License.

## References

- [g119612 Library](https://github.com/sirosfoundation/g119612)
- [EWC Trust Mechanism RFC](https://github.com/EWC-consortium/eudi-wallet-rfcs/blob/main/ewc-rfc012-trust-mechanism.md)
- [ETSI TS 119 612](https://www.etsi.org/deliver/etsi_ts/119600_119699/119612/02.03.01_60/ts_119612v020301p.pdf)
- [ETSI TS 119 602](https://www.etsi.org/deliver/etsi_ts/119600_119699/119602/)
