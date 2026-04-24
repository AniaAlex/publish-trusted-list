# CSR and Certificate Field Responsibilities

This document defines what fields an **Entity** sets in a Certificate Signing Request (CSR) versus what the **Access Certificate Authority (CA)** sets in the issued certificate.

## Combined Reference Table

| Field | Entity Sets in CSR | CA Sets in Certificate | Source Status | Reference |
|-------|-------------------|------------------------|---------------|-----------|
| **Subject DN** (`C`, `O`, `CN`, `organizationIdentifier`) | ✅ Yes | Copies (after verifying vs Registry) | ✅ Explicit | [relying_party_access_certificate.md L316-327][1]; [pid_provider_access_certificate.md L157-162][2]; ETSI EN 319 412-3 clause 4.2.1; CIR 2025/848 Annex I |
| **subjectAltName** (URI, email, phone) | ✅ Yes (request) | May verify/override | ✅ Explicit | [relying_party_access_certificate.md L340-348][1]; ETSI TS 119 411-8 GEN-6.6.1-07; CIR 2025/848 Annex I.7 |
| **keyUsage** (`digitalSignature`) | ❌ No | ✅ Yes (critical) | ✅ Explicit | [pid_provider_access_certificate.md L102][2]; [relying_party_access_certificate.md L335][1]; ETSI EN 319 411-1 clause 6.6.1 |
| **extendedKeyUsage** (`id-kp-clientAuth`) | ❌ No | ✅ Yes | ✅ Explicit | [pid_provider_access_certificate.md L103][2]; ETSI EN 319 411-1 clause 6.6.1 |
| **basicConstraints** (`CA:FALSE`) | ❌ No | ✅ Yes (critical) | ⚠️ Inferred | Standard PKI practice per RFC 5280; ETSI EN 319 412-3 |
| **certificatePolicies** (NCP/QCP OID) | ❌ No | ✅ Yes | ✅ Explicit | [relying_party_access_certificate.md L344-352][1]; ETSI TS 119 411-8 clause 5.3 |
| **qcStatements** (entitlements) | ❌ No | ✅ Yes | ✅ Explicit | [eudi-wallet-trust-and-entitlement-discovery.md L253][3]; [eaa_provider_access_certificate.md L95][4] |
| **authorityInfoAccess** (OCSP URI) | ❌ No | ✅ Yes | ⚠️ Inferred | Standard PKI practice per RFC 5280; ETSI EN 319 411-1 |
| **crlDistributionPoints** (CRL URI) | ❌ No | ✅ Yes | ⚠️ Inferred | Standard PKI practice per RFC 5280; ETSI EN 319 411-1 |
| **authorityKeyIdentifier** | ❌ No | ✅ Yes | ⚠️ Inferred | Standard PKI practice per RFC 5280 |

## Entitlement OIDs (Set by CA in qcStatements)

| Entity Type | Entitlement Label | OID | Source Status | Reference |
|-------------|-------------------|-----|---------------|-----------|
| Relying Party (Service Provider) | `Service_Provider` | `0.4.0.19475.1.1` | ✅ Explicit | [relying_party_access_certificate.md L272][1]; ETSI TS 119 475 Annex A.2.1 |
| QEAA Provider | `QEAA_Provider` | `0.4.0.19475.1.2` | ✅ Explicit | [eaa_provider_access_certificate.md L110, L273][4]; ETSI TS 119 475 Annex A.2.2 |
| Non-Qualified EAA Provider | `Non_Q_EAA_Provider` | `0.4.0.19475.1.3` | ✅ Explicit | [eaa_provider_access_certificate.md L176, L274][4]; ETSI TS 119 475 Annex A.2.3 |
| Public Sector EAA Provider | `PUB_EAA_Provider` | `0.4.0.19475.1.4` | ✅ Explicit | [eaa_provider_access_certificate.md L236, L275][4]; ETSI TS 119 475 Annex A.2.4 |
| PID Provider | `PID_Provider` | `0.4.0.19475.1.5` | ✅ Explicit | [pid_provider_access_certificate.md L143][2]; ETSI TS 119 475 Annex A.2.5 |

## Certificate Policy OIDs (Set by CA in certificatePolicies)

| Entity Type | Policy Name | OID | Source Status | Reference |
|-------------|-------------|-----|---------------|-----------|
| Relying Party (legal person) | NCP-l-eudiwrp | `0.4.0.194118.1.2` | ✅ Explicit | [relying_party_access_certificate.md L109, L351][1]; ETSI TS 119 411-8 clause 5.3 |
| Relying Party (natural person) | NCP-n-eudiwrp | `0.4.0.194118.1.1` | ✅ Explicit | [relying_party_access_certificate.md L193][1]; ETSI TS 119 411-8 clause 5.3 |
| PID Provider | NCP-l-eudiwrp | `0.4.0.194118.1.2` | ✅ Explicit | [pid_provider_access_certificate.md][2]; ETSI TS 119 411-8 clause 5.3 |
| QEAA Provider | QCP-l-eudiwrp | `0.4.0.194118.1.4` | ✅ Explicit | [eaa_provider_access_certificate.md][4]; ETSI TS 119 411-8 clause 5.3 |
| Non-Q EAA Provider | NCP-l-eudiwrp | `0.4.0.194118.1.2` | ✅ Explicit | [eaa_provider_access_certificate.md][4]; ETSI TS 119 411-8 clause 5.3 |

## Source Status Legend

| Status | Meaning |
|--------|---------|
| ✅ **Explicit** | Directly stated in wp4-trust-group workspace documentation |
| ⚠️ **Inferred** | Standard PKI practice based on ETSI/RFC standards; not explicitly documented in workspace |

## Documentation Gaps

The following are **NOT documented** in the wp4-trust-group workspace:

1. **CSR submission protocol** — How entity submits CSR to Access CA (API? format?)
2. **Registrar → Access CA notification** — Message format, API, authentication
3. **Certificate return mechanism** — How signed cert is delivered to entity
4. **Division of responsibility** — Explicit statement that "entity sets X in CSR, CA sets Y in cert"

## Normative References

| Standard | Description |
|----------|-------------|
| ETSI TS 119 411-8 | Access Certificate Policy for EUDI Wallet Relying Parties |
| ETSI EN 319 411-1 | Policy and security requirements for TSPs issuing certificates |
| ETSI EN 319 412-3 | Certificate profile for certificates issued to legal persons |
| ETSI EN 319 412-2 | Certificate profile for certificates issued to natural persons |
| ETSI TS 119 475 | Relying party attributes supporting EUDI Wallet user's authorization decisions |
| CIR (EU) 2025/848 | Commission Implementing Regulation on registration of wallet-relying parties |
| RFC 5280 | Internet X.509 Public Key Infrastructure Certificate and CRL Profile |

## Workspace File References

[1]: ../wp4-trust-group/task5-participants-certificates-policies/relying_party_access_certificate.md
[2]: ../wp4-trust-group/task5-participants-certificates-policies/pid_provider_access_certificate.md
[3]: ../wp4-trust-group/task2-trust-framework/eudi-wallet-trust-and-entitlement-discovery.md
[4]: ../wp4-trust-group/task5-participants-certificates-policies/eaa_provider_access_certificate.md

---

*Generated: 2026-04-24*
*Source workspace: wp4-trust-group*
