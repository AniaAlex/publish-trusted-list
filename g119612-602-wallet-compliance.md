# g119612 / ETSI TS 119 602 Wallet Ecosystem — Analysis & Conclusions

## 1. Standards Overview

### ETSI TS 119 612 — Trust Status Lists (TSL)
- XML-based, root element `<TrustServiceStatusList>`
- Namespace: `http://uri.etsi.org/19612/v2.4.1#`
- Signatures: XAdES (XML Digital Signature)
- Used for: traditional eIDAS CA/TSA trust lists, LoTL (List of Trusted Lists)
- Entity model: Trust Service Providers (TSPs) containing Services, each service has an X.509 certificate

### ETSI TS 119 602 — Lists of Trusted Entities (LoTE)
- Successor to TS 119 612 for the EU wallet ecosystem
- Defines **both** JSON (preferred) and XML bindings
- Signatures: JAdES (JSON Web Signature) for JSON, XAdES for XML
- Entity model: Trusted Entities with digital identities (X.509, JWK, DID) and services
- For XML binding, **option 1** is to use the TS 119 612 schema directly (recommended for compatibility)

---

## 2. The g119612 Library (Siros Foundation)

Source: https://github.com/sirosfoundation/g119612

The library provides a `tsl-tool` CLI with two separate pipeline paths:

### Path A: XML (TS 119 612 schema)
```
generate  →  publish
```
- Reads: `scheme.yaml` + `providers/<name>/provider.yaml` + `<cert>.pem` (DER format) + `<cert>.yaml`
- Produces: `<TrustServiceStatusList>` XML
- Signing: XML-DSIG, RSA + SHA-256, via `goxmldsig`
- **Schema compliance**: Valid TS 119 612 XML = valid TS 119 602 XML binding option 1

### Path B: JSON (g119612 custom format)
```
generate-lote  →  publish-lote
```
- Reads: `scheme.yaml` + `entities/<name>/entity.yaml` + cert/JWK/DID files
- Produces: custom JSON (NOT conformant with formal TS 119 602 JSON schema)
- Signing: JWS compact serialization, EC (prime256v1) or RSA, via custom JWS package
- **Schema compliance**: NOT conformant with formal ETSI TS 119 602 JSON schema

### Key bugs in g119612
| Location | Bug | Impact |
|---|---|---|
| `etsi119612/19612_sie_xsd.xsd.go` | `QualificationElement` is `*single` not `[]*slice` | Silent data loss when parsing real EU TSLs with multiple qualification rules |
| `etsi119612/19612_sie_xsd.xsd.go` | `Qualifier` is `*single` not `[]*slice` | Same — only last qualifier survives |
| `etsi119602/convert.go` | `LoTEPointer.SchemeTerritory` and `SchemeType` never populated | Converted LoTE pointers have no type/territory info |
| `pipeline/step_generate.go` | `x509.ParseCertificate` called on cert bytes expecting DER, fails on PEM | XML generation crashes if provider certs are PEM format — must use `-outform DER` |
| `pipeline/pipeline.go:50` | Returns `nil` ctx on step error causing nil pointer dereference | Panic instead of clean error when generate step fails |

---

## 3. JSON Format Mismatch — g119612 vs Formal TS 119 602

| Field / concept | Formal TS 119 602 JSON schema | g119612 output |
|---|---|---|
| Root wrapper | `{ "LoTE": { "loteTag", "loteType", "loteVersionIdentifier" } }` | `{ "version": "1.0", "schemeInformation": ..., "trustedEntities": ... }` |
| Language key | `"lang"` | `"language"` |
| Entity identifier | `TEInformationURI` — typed URI pair | `entityId` — single plain URI |
| Required entity fields | `TEName`, `TEAddress`, `TETradeName` | none of these exist |
| Scheme info wrapper | `ListAndSchemeInformation` | `schemeInformation` |
| LoTE pointers | `LoTEQualifiers` with `MimeType` required | `LoTEPointer` without `MimeType` |

**Conclusion**: The g119612 JSON format works within the g119612/Go-Trust ecosystem but is NOT interoperable with consumers expecting the formal ETSI TS 119 602 JSON schema.

---

## 4. Wallet Ecosystem LoTE Model

### One LoTE per type per country

The ETSI implementation profile (wp4-trust-group) defines 6 distinct LoTE types, each with its own `schemeType` URI:

| LoTE type | schemeType URI | Contains |
|---|---|---|
| PID Providers | `http://uri.etsi.org/19602/LoTEType/EUPIDProvidersList` | PID issuers |
| Wallet Providers | `http://uri.etsi.org/19602/LoTEType/EUWalletProvidersList` | Wallet solutions |
| Pub-EAA Providers | `http://uri.etsi.org/19602/LoTEType/EUPubEAAProvidersList` | Public EAA issuers |
| WRPAC Providers | `http://uri.etsi.org/19602/LoTEType/EUWRPACProvidersList` | Wallet relying party attribute consumers |
| WRPRC Providers | `http://uri.etsi.org/19602/LoTEType/EUWRPRCProvidersList` | Wallet relying party registration consumers |
| Registrars | `http://uri.etsi.org/19602/LoTEType/EURegistrarsAndRegistersList` | Registrars/registers |

Each country publishes one LoTE per type. The LoTL has one distribution point entry per (country, type) pair.

### Contrast with Siros/g119612 documentation model

The Siros developer documentation (https://developers.siros.org/sirosid/trust/lote-publishing/) shows one LoTE per country with `schemeType: EUgeneric`. This is the **traditional eIDAS model**, not the wallet ecosystem model. The library itself does not restrict which URIs you use — the `EUgeneric` is just an example.

---

## 5. Service Type URIs

### TS 119 612 (traditional eIDAS — normative ETSI)
| URI | Meaning |
|---|---|
| `http://uri.etsi.org/TrstSvc/Svctype/CA/QC` | Qualified Certificate Authority |
| `http://uri.etsi.org/TrstSvc/Svctype/CA/PKC` | Public Key Certificate CA |
| `http://uri.etsi.org/TrstSvc/Svctype/TSA/QTST` | Qualified Time Stamp Authority |
| `http://uri.etsi.org/TrstSvc/Svctype/TSA` | Time Stamp Authority |

### TS 119 612 wallet-specific (proposed/custom — NOT normative ETSI)
| URI | Meaning |
|---|---|
| `http://uri.etsi.org/TrstSvc/Svctype/WalletProvider` | Generic wallet provider |
| `http://uri.etsi.org/TrstSvc/Svctype/IndividualWalletProvider` | Individual wallet |
| `http://uri.etsi.org/TrstSvc/Svctype/LegalPersonWalletProvider` | Legal entity wallet |
| `http://uri.etsi.org/TrstSvc/Svctype/PID_Issuer` | PID issuer |
| `http://uri.etsi.org/TrstSvc/Svctype/QEAA_Provider` | Qualified EAA provider |
| `http://uri.etsi.org/TrstSvc/Svctype/PUB_EAA_Provider` | Public EAA provider |
| `http://uri.etsi.org/TrstSvc/Svctype/Non_Q_EAA_Provider` | Non-qualified EAA provider |

### TS 119 602 (wallet ecosystem — normative ETSI)
| URI | Meaning |
|---|---|
| `http://uri.etsi.org/19602/SvcType/PID/Issuance` | PID issuance |
| `http://uri.etsi.org/19602/SvcType/PID/Revocation` | PID revocation |
| `http://uri.etsi.org/19602/SvcType/WalletSolution/Issuance` | Wallet solution issuance |
| `http://uri.etsi.org/19602/SvcType/WalletSolution/Revocation` | Wallet solution revocation |
| `http://uri.etsi.org/19602/SvcType/QEAA/Issuance` | QEAA issuance |
| `http://uri.etsi.org/19602/SvcType/PubEAA/Issuance` | Public EAA issuance |
| `http://uri.etsi.org/19602/SvcType/PubEAA/Revocation` | Public EAA revocation |
| `http://uri.etsi.org/19602/SvcType/WRPAC/Issuance` | WRPAC issuance |
| `http://uri.etsi.org/19602/SvcType/WRPRC/Issuance` | WRPRC issuance |
| `http://uri.etsi.org/19602/SvcType/RelyingParty/Verification` | Verifier / relying party |
| `http://uri.etsi.org/19602/SvcType/Register` | Register service |

When publishing via the TS 119 612 XML path for wallet LOTEs, use the **TS 119 602 URIs** in `<ServiceTypeIdentifier>` — not the proposed 612-namespace custom URIs.

---

## 6. LoTL Structure (lotl_euwallet)

The LoTL is a TS 119 602 JSON document (using the formal schema, not g119612 format) with:
- `loteTag`: `http://uri.etsi.org/19602/LoTETag`
- `loteType`: `EUgeneric` (the LoTL itself is generic — it points to typed LOTEs)
- `distributionPoints[]`: one entry per (country, type) pair, each with:
  - `tlType`: internal type string (e.g. `"pid-provider"`)
  - `tlUrlJson`: URL to the JSON LoTE
  - `tlUrlXml`: URL to the XML LoTE

Consumers pick JSON or XML depending on what they support. Both URLs can coexist for the same LoTE.

---

## 7. What g119612 Can and Cannot Produce for the Wallet Ecosystem

| Output | Wallet ecosystem compliant? | Notes |
|---|---|---|
| `tsl-0.xml` via `generate` + `publish` | **Yes** | TS 119 612 schema = valid TS 119 602 XML binding option 1. Use 19602 service type URIs. Serves `tlUrlXml`. |
| `lote-SE.json` via `generate-lote` + `publish-lote` | **No** | Custom g119612 format only. Not formal 119 602 JSON schema. Works in g119612/Go-Trust ecosystem only. |
| Formal TS 119 602 JSON | **Not possible without rewrite** | Would require rewriting the `etsi119602` package to match the ETSI schema field names and structure. |

### Missing fields in XML output (production gaps)
The `generate` + `publish` pipeline leaves these fields empty that are required in production:
- `<ListIssueDateTime>` — should be current datetime
- `<StatusStartingTime>` — should be service activation date
- `<StatusDeterminationApproach>` — should be e.g. `http://uri.etsi.org/19602/PIDProvidersList/StatusDetn/EU`

These require either post-processing or changes to g119612's `GenerateTSL` step.

---

## 8. Directory Structure Implemented

```
go-trust-ecosystem-602-lote/
├── Makefile                        # root: all / all-keys / all-sign / all-keys-xml / all-xml / all-sign-xml
│
├── lote-pid-providers/             # EUPIDProvidersList
│   ├── scheme.yaml                 # schemeType + type = EUPIDProvidersList, territory SE
│   ├── pipeline.yaml               # generate-lote + publish-lote → JSON
│   ├── pipeline-sign.yaml          # generate-lote + publish-lote (JWS signed) → JSON
│   ├── pipeline-xml.yaml           # generate + publish → XML (unsigned)
│   ├── pipeline-xml-sign.yaml      # generate + publish (XML-DSIG signed) → XML
│   ├── Makefile
│   ├── entities/                   # JSON path input
│   │   ├── se-pid-issuer-a/entity.yaml
│   │   └── se-pid-issuer-b/entity.yaml
│   ├── providers/                  # XML path input
│   │   ├── se-pid-issuer-a/provider.yaml + cert.yaml + cert.pem (DER)
│   │   └── se-pid-issuer-b/provider.yaml + cert.yaml + cert.pem (DER)
│   └── output/
│       ├── lote-SE.json            # g119612 custom JSON (not formal 602 schema)
│       ├── lote-SE.json.jws        # JWS-signed, EC key
│       └── tsl-0.xml               # XML-DSIG signed, RSA key — SCHEMA VALID for wallet ecosystem
│
├── lote-wallet-providers/          # EUWalletProvidersList
│   └── ... (same structure)
│       └── entities/example-wallet-provider/   SvcType/WalletSolution/Issuance
│
├── lote-qeaa-providers/            # EUQEAAProvidersList
│   └── ... (same structure)
│       └── entities/example-qeaa-issuer/       SvcType/QEAA/Issuance
│
└── lote-verifiers/                 # EURelyingPartyList
    └── ... (same structure)
        └── entities/example-verifier/          SvcType/RelyingParty/Verification
```

### Makefile targets per sub-directory
| Target | Action |
|---|---|
| `make keys` | Generate PEM certs for entities/ (JSON path) |
| `make lote` | Generate unsigned JSON LoTE |
| `make sign` | Generate JWS-signed JSON LoTE (EC key) |
| `make keys-xml` | Generate DER certs for providers/ (XML path) |
| `make lote-xml` | Generate unsigned XML LoTE |
| `make sign-xml` | Generate XML-DSIG signed XML LoTE (RSA 2048 key) |

### Root Makefile orchestration targets
| Target | Action |
|---|---|
| `make all` | Run `lote` for all 4 types |
| `make all-keys` | Run `keys` for all 4 types |
| `make all-sign` | Run `sign` for all 4 types |
| `make all-keys-xml` | Run `keys-xml` for all 4 types |
| `make all-xml` | Run `lote-xml` for all 4 types |
| `make all-sign-xml` | Run `sign-xml` for all 4 types |

---

## 9. Signing Summary

| Format | Algorithm | Key type | Signer | Output |
|---|---|---|---|---|
| JSON LoTE (JWS) | ES256 (ECDSA P-256) | EC prime256v1 | g119612 JWS package | `lote-SE.json.jws` (compact serialization) |
| XML LoTE (XML-DSIG) | RSA-SHA256 | RSA 2048 | goxmldsig (enveloped) | `tsl-0.xml` with `<ds:Signature>` at end |

Note: The XML signer only supports RSA keys. EC keys used for JWS will not work for XML-DSIG with the current g119612 dsig package.

---

## 10. Conclusions

1. **Use the XML path for wallet ecosystem compliance today.** The `generate` + `publish` XML output is schema-valid as TS 119 602 XML binding option 1. Use `19602/SvcType/...` URIs in service identifiers.

2. **The JSON path is not formally compliant.** g119612's `publish-lote` produces a custom JSON format that does not match the ETSI TS 119 602 JSON schema. It works within the Siros/Go-Trust ecosystem only.

3. **One LoTE per type per country.** The wallet ecosystem requires separate LOTEs for PID providers, wallet providers, QEAA providers, verifiers, etc. — not one generic LoTE per country.

4. **The LoTL supports both.** Each `distributionPoints` entry has `tlUrlJson` and `tlUrlXml` — consumers pick the format they support. Publish both and serve via HTTPS.

5. **The Siros `EUgeneric` model is for traditional eIDAS TSLs**, not wallet LOTEs. The library itself is flexible — use wallet-specific LoTE type URIs and 19602 service URIs regardless of what the Siros documentation examples show.

6. **Production XML gaps to fix** (in g119612 or post-processing):
   - `<ListIssueDateTime>` must be populated
   - `<StatusDeterminationApproach>` must match the LoTE type
   - `<StatusStartingTime>` per service must be set

7. **QualificationElement bug** in g119612 causes silent data loss when parsing real EU TSLs with multiple qualification rules — relevant if consuming existing EU member state TSLs.
