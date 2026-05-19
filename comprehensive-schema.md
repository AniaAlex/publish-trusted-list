# WP4Trust Architecture — Mermaid Schema

## 1. Trust Infrastructure Overview

```mermaid
flowchart TD
    subgraph EU["EU Trust Infrastructure (ETSI TS 119 602)"]
        LOTL["🌍 EU List of Trusted Lists (LoTL)\n─────────────────────────────\nLoTEType: EUListOfTrustedLists\nPublished by: trust-dev-1.iam.sunet.se/lote/\nSigned: JAdES-B-B / XAdES-B-B\nFormat: .json / .json.jws / .xml"]

        subgraph LOTES["LoTE Pointers"]
            PUBEAA_LOTE["📋 PubEAA Providers LoTE\n─────────────────────────────\nLoTEType: EUPubEAAProvidersList\nSource: ms-registry /api/lote-source/pubeaa-providers/\nSigned by: docker-siros-lote\nPublished: /lote/pubeaa_providers/\nServiceStatus: notified / withdrawn\nHistory: permanent (65535)"]

            ACCESS_CA_LOTE["🔐 Access CA LoTE\n(WRPAC Providers LoTE)\n─────────────────────────────\nLoTEType: EUWRPACProvidersList\nSource: wp4-onboarding /lists/wrpac_providers-EU.json\nSigned by: docker-siros-lote\nPublished: /lote/wrpac_providers/\nLists: Access CAs authorised to\nissue WRPAC certificates"]
        end

        LOTL -->|"PointersToOtherLoTE"| PUBEAA_LOTE
        LOTL -->|"PointersToOtherLoTE"| ACCESS_CA_LOTE
    end

    subgraph CA_INFRA["Access CA Infrastructure"]
        ACCESS_CA["🏛️ Access CA\n(WRPAC Certificate Authority)\n─────────────────────────────\nListed in: Access CA LoTE\nIssues: X.509 WRPAC certificates\nto registered relying parties\ndeploy: django-ca-cmc / pkcs11_ca"]
    end

    ACCESS_CA_LOTE -->|"contains cert of"| ACCESS_CA

    subgraph REGISTRY["MS Registry (Member State)"]
        MS_REG["🗂️ ms-registry\n─────────────────────────────\nETSI TS 119 475 / TS5\nDjango + PostgreSQL\nServed: trust-dev-1.iam.sunet.se/api/\n\nStores: RegisteredEntity, EntityEntitlement,\nIntendedUse, EntityAccessCertificate\nExposes: /registry/wrp/ (TS5 WRP API)\nSigns:   cnf JWTs (ES256 P-256)\nExports: LoTE source for signing pipeline"]
    end

    subgraph SIGNER["Signing Pipeline"]
        SIROS_LOTE["✍️ docker-siros-lote\n─────────────────────────────\nloads LoTE from ms-registry\nor wp4-onboarding,\nsigns with JAdES-B-B,\npublishes to /var/www/html/lote/"]
    end

    subgraph GOTRUST["go-trust Service"]
        GT["⚙️ go-trust\n─────────────────────────────\nConfig: loads EU LoTL URL\nFrequency: every 5 min\nPort: 6001 (TLS)\nServed: trust-dev-1.iam.sunet.se/trust/\n\nPipeline (YAML):\n  set-fetch-options (depth, UA, timeout)\n  load LoTL\n  follow PointersToOtherLoTE\n  select certs (by type, status)\n  build x509.CertPool\n  expose trust evaluation API"]
    end

    MS_REG -->|"unsigned LoTE source"| SIROS_LOTE
    SIROS_LOTE -->|"signed LoTE published"| LOTL
    LOTL -->|"configured as trust anchor"| GT

    subgraph VERIFIER["Relying Party (Verifier)"]
        RP["🏢 Verifier / Relying Party\n─────────────────────────────\nRegisters in MS Registry\nHolds: X.509 WRPAC (Access Certificate)\nIssued by: Access CA\nPresents cert when connecting to wallet"]
    end

    subgraph WALLET["EUDI Wallet Unit"]
        WU["📱 Wallet Unit\n─────────────────────────────\nReceives Access Certificate from verifier\nCalls go-trust to verify cert chain:\n  LoTL → Access CA LoTE → Access CA cert\n  → validates X.509 chain"]
    end

    ACCESS_CA -->|"issues WRPAC cert\n(after registry check)"| RP
    MS_REG -->|"1. registers entity\n2. stores WRPAC"| RP
    RP -->|"presents WRPAC"| WU
    WU -->|"verify cert chain"| GT
    GT -->|"resolves Access CA\nfrom LoTL chain"| ACCESS_CA_LOTE
```

---

## 2. Verifier Registration & Certificate Issuance Flow

```mermaid
sequenceDiagram
    actor V as Verifier (Relying Party)
    participant MS as MS Registry<br/>/api/
    participant CA as Access CA<br/>(django-ca-cmc)
    participant LOTE as Access CA LoTE<br/>(WRPAC Providers)
    participant LOTL as EU LoTL

    Note over V,LOTL: Phase 1 — Registration

    V->>MS: POST /registry/wrp/<br/>{legal entity data, entitlements, intended use}
    MS-->>V: 201 Created {entity_id}

    Note over V,LOTL: Phase 2 — Access Certificate Issuance

    V->>MS: GET /certificates/cnf/{entity_id}/
    MS-->>V: signed cnf JWT (ES256, registry data confirmed)

    V->>MS: GET /.well-known/jwks.json
    MS-->>V: registry public key (JWKS)

    V->>V: Verify cnf JWT signature

    V->>CA: Submit CSR + cnf JWT
    CA->>MS: GET /registry/wrp/{entity_id}/ (verify status = valid)
    MS-->>CA: registered entity data

    CA->>CA: Issue X.509 WRPAC<br/>(policy OID, entitlements, CT log SCT)

    CA-->>V: WRPAC certificate (PEM)

    V->>MS: POST /certificates/upload/{entity_id}/<br/>{WRPAC PEM}
    MS-->>V: {certificate_id, status: stored}

    Note over LOTE,LOTL: Access CA cert is already listed<br/>in Access CA LoTE which is<br/>referenced in EU LoTL
```

---

## 3. Wallet Connection & Certificate Verification Flow

```mermaid
sequenceDiagram
    actor V as Verifier (Relying Party)
    participant WU as Wallet Unit
    participant GT as go-trust<br/>/trust/
    participant LOTL as EU LoTL<br/>/lote/
    participant ACA_LOTE as Access CA LoTE<br/>/lote/wrpac_providers/
    participant ACA as Access CA

    Note over V,ACA: Wallet connection — verifier presents WRPAC

    V->>WU: Connect + present WRPAC (X.509 Access Certificate)

    WU->>GT: POST /evaluation<br/>{certificate chain}

    activate GT
    Note over GT: Pipeline execution (every 5 min cached)

    GT->>LOTL: GET /lote/list_of_trusted_lists.json.jws
    LOTL-->>GT: signed LoTL (JAdES-B-B)
    GT->>GT: verify LoTL signature

    GT->>LOTL: follow PointersToOtherLoTE
    GT->>ACA_LOTE: GET /lote/wrpac_providers.json.jws
    ACA_LOTE-->>GT: signed Access CA LoTE (JAdES-B-B)
    GT->>GT: verify LoTE signature

    GT->>GT: extract Access CA X.509 cert<br/>from Access CA LoTE

    GT->>GT: build x509.CertPool<br/>from trusted Access CA certs

    GT->>GT: verify WRPAC chain:<br/>WRPAC → Access CA in pool

    deactivate GT
    GT-->>WU: trust evaluation result<br/>{trusted: true, entity_id, entitlements}

    WU->>WU: check intended use<br/>matches requested credential

    WU-->>V: connection established<br/>(or rejected with reason)
```

---

## 4. Component Deployment Map

```mermaid
flowchart LR
    subgraph HOST["trust-dev-1.iam.sunet.se"]
        direction TB

        subgraph TLS["TLS Layer"]
            NGINX["nginx :443\n──────────────\n/lote/    → static files\n/trust/   → go-trust:6001\n/api/     → ms-registry:8000\n/static/  → ms-registry:8000\n/media/   → ms-registry:8000"]
            REDIR["always-https :80\n──────────────\nHTTP→HTTPS redirect\nACME challenges"]
        end

        subgraph CONTAINERS["Docker Containers (internal)"]
            GT_C["go-trust :6001\n──────────────\nimage: docker-go-trust\nconfig: YAML pipeline\nloads EU LoTL every 5m"]
            MS_C["ms-registry :8000\n──────────────\nimage: docker-ms-registry\nDjango + uWSGI"]
            DB["postgres :5432\n──────────────\nMS Registry data"]
            REDIS["redis :6379\n──────────────\nMS Registry cache"]
            SIROS["docker-siros-lote\n──────────────\nPolls ms-registry\nSigns LoTEs (JAdES)\nWrites to /var/www/html/lote/"]
        end

        subgraph FILES["Static Files (/var/www/html/lote/)"]
            F1["list_of_trusted_lists.json.jws"]
            F2["pubeaa_providers.json.jws"]
            F3["wrpac_providers.json.jws\n(Access CA LoTE)"]
            F4["pid_providers.json.jws"]
            F5["wallet_providers.json.jws"]
        end
    end

    NGINX --> GT_C
    NGINX --> MS_C
    MS_C --> DB
    MS_C --> REDIS
    SIROS --> MS_C
    SIROS --> FILES
    NGINX --> FILES
    GT_C -->|"fetches at startup\n+ every 5 min"| FILES
```

---

## 5. LoTL → LoTE Trust Chain Detail

```mermaid
flowchart TD
    subgraph TRUST_CHAIN["EU Trust Chain (ETSI TS 119 602)"]
        LOTL_BOX["EU LoTL\nlist_of_trusted_lists.json.jws\n────────────────────────────────\nLoTEType: EUListOfTrustedLists\nSigned by: EU Scheme Operator\n(g119612 / docker-siros-lote)"]

        PUBEAA["PubEAA Providers LoTE\npubeaa_providers.json.jws\n────────────────────────────────\nLoTEType: EUPubEAAProvidersList\nServiceStatus: mandatory\n  notified = trusted\n  withdrawn = revoked (stays in list)\nHistoricalInformationPeriod: 65535\nSignature: JAdES or XAdES\nSource: ms-registry DB"]

        WRPAC["Access CA LoTE\n(WRPAC Providers LoTE)\nwrpac_providers.json.jws\n────────────────────────────────\nLoTEType: EUWRPACProvidersList\nLists Access CAs with their:\n  X.509 root cert\n  ServiceSupplyPoints (mandatory)\n  ServiceType: WRPAC/Issuance+Revocation\nSigned: JAdES-B-B\nSource: wp4-onboarding"]

        LOTL_BOX -->|"PointersToOtherLoTE[0]"| PUBEAA
        LOTL_BOX -->|"PointersToOtherLoTE[1]"| WRPAC

        ACCESS_CA_CERT["Access CA X.509 Certificate\n────────────────────────────────\nEmbedded in: Access CA LoTE\nServiceDigitalIdentity\nUsed by: go-trust to build\nx509.CertPool for WRPAC validation"]

        WRPAC_CERT["WRPAC Certificate\n(Verifier's Access Certificate)\n────────────────────────────────\nIssuer: Access CA\nSubject: Registered Relying Party\nContains: policy OID, entitlements\nPresented to: Wallet Unit"]

        WRPAC -->|"contains cert"| ACCESS_CA_CERT
        ACCESS_CA_CERT -->|"is issuer of"| WRPAC_CERT
    end

    GT_VERIFY["go-trust\n────────────────────────────────\n1. Fetch + verify LoTL signature\n2. Follow PointersToOtherLoTE\n3. Fetch + verify Access CA LoTE\n4. Extract Access CA cert → CertPool\n5. Verify WRPAC chain against pool\n6. Return trust evaluation result"]

    LOTL_BOX -->|"configured as root URL"| GT_VERIFY
    WRPAC_CERT -->|"presented by verifier\nfor validation"| GT_VERIFY
```
