# Entitlements vs Intended Use Requirements

This document summarizes which entitlements require `intendedUse` registration based on EC Technical Specification TS5.

**Date**: 2026-04-24  
**Source**: [EC TS5 - Common formats and API for Relying Party Registration information](https://github.com/eu-digital-identity-wallet/eudi-doc-standards-and-technical-specifications/blob/main/docs/technical-specifications/ts5-common-formats-and-api-for-rp-registration-information.md)

---

## Entitlements Summary

| Entitlement URI | Requires `intendedUse`? | Reason |
|-----------------|-------------------------|--------|
| `https://uri.etsi.org/19475/Entitlement/Service_Provider` | **YES** | Requests attributes from Wallet Units |
| `https://uri.etsi.org/19475/Entitlement/PID_Provider` | **NO** (unless also requests attributes) | Issues PIDs, doesn't request attributes |
| `https://uri.etsi.org/19475/Entitlement/QEAA_Provider` | **NO** (unless also requests attributes) | Issues QEAAs, doesn't request attributes |
| `https://uri.etsi.org/19475/Entitlement/PUB_EAA_Provider` | **NO** (unless also requests attributes) | Issues PuB-EAAs, doesn't request attributes |
| `https://uri.etsi.org/19475/Entitlement/Non_Q_EAA_Provider` | **NO** (unless also requests attributes) | Issues non-qualified EAAs, doesn't request attributes |

---

## TS5 References

### 1. Pure Issuers (no `intendedUse` needed)

**Source**: TS5 Section 2.1 `WalletRelyingParty.intendedUse` attribute

> "IntendedUse is not required from Wallet-Relying Parties that register only to act as an intermediary. Note that the **attestation providers requesting attestations of attributes against their attestation provisioning service will need to register their intended use(s) as normal service providers do**."

**Source**: TS5 Section 2.4.3 `IntendedUse` class

> "An **Attestation Provider that does not intend to request any attestations from the Wallet Unit does not register an Intended use**."

### 2. Issuers that also request attributes (`intendedUse` required)

**Source**: TS5 Section 2.1 `WalletRelyingParty.entitlements` attribute

> "An attestation provider that requires presentation of another attestation during issuance of their own attestation **SHALL register both as a Service_Provider and with their attestation provider entitlement in a single registration**."

---

## Practical Examples

| Entity | Entitlements | intendedUse Required? | Explanation |
|--------|--------------|----------------------|-------------|
| Bank (requests PID for KYC) | `Service_Provider` | ✅ YES | Only requests, doesn't issue |
| Tax Authority (issues tax attestation, no PID request) | `PUB_EAA_Provider` | ❌ NO | Only issues, doesn't request |
| University (issues diploma, requests PID first) | `QEAA_Provider` + `Service_Provider` | ✅ YES | Issues AND requests |
| PID Provider (issues PID, no prior requests) | `PID_Provider` | ❌ NO | Only issues, doesn't request |
| PID Provider (re-issues PID, requests old PID) | `PID_Provider` + `Service_Provider` | ✅ YES | Issues AND requests |
| Identity Verification Service (intermediary) | `Service_Provider` (with `isIntermediary=true`) | ✅ YES | Requests on behalf of others |

---

## Example Flow: University Issuing Diploma (Dual Role)

This example illustrates a QEAA Provider (University) that also acts as a Relying Party during issuance.

**Registration**: University registers with **both** entitlements:
- `QEAA_Provider` (to issue diploma attestations)
- `Service_Provider` (to request PID during issuance)

**Flow**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: User initiates diploma attestation request                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  User ──────────────────► University (QEAA Provider)                        │
│         "I want my diploma attestation"                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: University (acting as RP) requests PID to verify identity         │
├─────────────────────────────────────────────────────────────────────────────┤
│  University ──────────────► Wallet Unit                                     │
│  (Service_Provider role)    "Present your PID for identity verification"   │
│                                                                             │
│  ⚠️ This step requires `intendedUse` registration!                         │
│  - purpose: "Verify student identity for diploma issuance"                  │
│  - credentials: [PID with claims: family_name, given_name, birth_date]      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Wallet Unit presents PID to University                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Wallet Unit ──────────────► University                                     │
│               PID presentation (after user consent)                         │
│                                                                             │
│  University validates:                                                      │
│  - PID signature via PID Provider TL                                        │
│  - PID not revoked                                                          │
│  - Identity matches student records                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: University (acting as Issuer) issues diploma attestation          │
├─────────────────────────────────────────────────────────────────────────────┤
│  University ──────────────► Wallet Unit                                     │
│  (QEAA_Provider role)       Diploma attestation (QEAA)                      │
│                                                                             │
│  Wallet Unit validates:                                                     │
│  - University Access Certificate via Access CA TL                           │
│  - University is registered QEAA Provider                                   │
│  - Qualified signature via QTSP TL                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**University Registration Data**:

| Field | Value |
|-------|-------|
| `entitlements` | `["QEAA_Provider", "Service_Provider"]` |
| `intendedUse.purpose` | "Verify student identity before issuing academic credentials" |
| `intendedUse.credentials` | `[{type: "PID", claims: ["family_name", "given_name", "birth_date"]}]` |
| `providesAttestations` | `[{type: "Diploma", format: "vc+sd-jwt"}]` |

**Reference**: [TS5 Section 2.1](https://github.com/eu-digital-identity-wallet/eudi-doc-standards-and-technical-specifications/blob/main/docs/technical-specifications/ts5-common-formats-and-api-for-rp-registration-information.md) - "An attestation provider that requires presentation of another attestation during issuance of their own attestation SHALL register both as a Service_Provider and with their attestation provider entitlement in a single registration."

---

## Decision Rule

| Role | intendedUse Registration |
|------|--------------------------|
| **Requests** attributes from Wallet Unit | ✅ Required |
| **Only issues** credentials (no attribute requests) | ❌ Not required |
| **Acts as intermediary** (on behalf of other RPs) | ✅ Required (for the intermediated requests) |

---

## Related TS5 Data Model

The `intendedUse` field in the `WalletRelyingParty` class contains:

| Field | Description |
|-------|-------------|
| `purpose` | Purpose of the intended data processing (Article 5(1)(b) GDPR) |
| `privacyPolicy` | Privacy policy URL for the intended use |
| `credentials` | Array of attestation types and claims to be requested |
| `intendedUseIdentifier` | Registrar-provided unique identifier |
| `createdAt` | Validity start date |
| `revokedAt` | End date (if revoked/expired) |

---

## References

| Document | Link |
|----------|------|
| EC TS5 v1.3 | [ts5-common-formats-and-api-for-rp-registration-information.md](https://github.com/eu-digital-identity-wallet/eudi-doc-standards-and-technical-specifications/blob/main/docs/technical-specifications/ts5-common-formats-and-api-for-rp-registration-information.md) |
| EC TS6 | [ts6-common-set-of-rp-information-to-be-registered.md](https://github.com/eu-digital-identity-wallet/eudi-doc-standards-and-technical-specifications/blob/main/docs/technical-specifications/ts6-common-set-of-rp-information-to-be-registered.md) |
| CIR 2025/848 | [Regulation on registration of wallet-relying parties](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L_202500848) |
| ETSI TS 119 475 | Relying Party attributes supporting EUDI Wallet user's authorisation decisions |
| ARF Topic 27 | Registration of PID Providers, Providers of QEAAs, PuB-EAAs, and non-qualified EAAs, and Relying Parties |
