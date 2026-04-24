# Signing Certificates and Trusted Lists by Entity Type

This document describes where signing certificates (trust anchors) are submitted and which Trusted Lists contain them for each entity type.

**Date**: 2026-04-24  
**Aligned with**: ARF v2.8.0, EC TS2, ETSI TS 119 602

---

## 1. PID Provider

| Question | Answer | Reference |
|----------|--------|-----------|
| Does PID Provider TL exist? | **YES** | [trust-infrastructure-schema.md](../../task2-trust-framework/trust-infrastructure-schema.md), Topic 31 |
| Does it contain signing cert? | **YES** | EC TS2 Section 2.5, CIR 2024/2980 Annex II 3.(h) |
| Where is signing cert created? | PID Provider (internal) | Inferred |
| Where is signing cert submitted? | MS Registrar → EC notification | [trust-infrastructure-schema.md#L150](../../task2-trust-framework/trust-infrastructure-schema.md), PPNot_02 |
| Format of signing cert? | X.509 certificate chain (`x5c` per RFC 7515) | EC TS2 Section 2.2 |
| Who compiles TL? | European Commission | PPNot_05 |
| Number of TLs needed to validate? | **1** (PID Provider TL) | OIA_12 |

---

## 2. QEAA Provider

| Question | Answer | Reference |
|----------|--------|-----------|
| Does QEAA Provider TL exist? | **YES** (national QTSP TL) | eIDAS Article 22 |
| Does it contain signing cert? | **YES** | eIDAS Article 22, ETSI TS 119 612 |
| Where is signing cert created? | QEAA Provider **IS a QTSP** - self-issues qualified certificate | [terms-and-entities.md#L31](../../task1-use-cases/terms-and-entities.md) |
| Where is signing cert submitted? | To **MS TLP** (QTSP supervision process) | eIDAS Article 21, Article 22 |
| Format of signing cert? | X.509 qualified certificate | ETSI EN 319 411-1 |
| Who compiles TL? | **MS TLP** (national QTSP TL) | [pid_eaa_provider_onboarding.md#L507](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md) |
| Number of TLs needed to validate? | **1** (national QTSP TL) | OIA_13, Art. 32 |

---

## 3. PuB-EAA Provider

| Question | Answer | Reference |
|----------|--------|-----------|
| Does PuB-EAA Provider TL exist? | **YES** | [trust-infrastructure-schema.md](../../task2-trust-framework/trust-infrastructure-schema.md), Topic 31, GenNot_01 |
| Does it contain signing cert? | **NO** | EC TS2 Section 2.6, CIR 2025/1569 Annex III |
| Where is signing cert? | **QTSP TL** (external QTSP's qualified certificate) | [trusted-list-registration-trust-evaluation-matrix.md#L41](../../task2-trust-framework/trusted-list-registration-trust-evaluation-matrix.md), ISSU_09 |
| Where is signing cert created? | **External QTSP** (PuB-EAA Provider is NOT a QTSP) | [relying-party-evaluates-credentials.md#L28](../../task1-use-cases/subtask1-2-trust-registry/relying-party-evaluates-credentials.md) |
| What goes to EC notification? | Authorization data, conformity assessment report (NOT signing cert) | PuBPNot_02, CIR 2025/1569 Article 5 |
| Who compiles PuB-EAA TL? | European Commission | Topic 31 |
| Who compiles QTSP TL? | MS TLP | eIDAS Article 22 |
| Number of TLs needed to validate? | **2** (PuB-EAA TL + QTSP TL) | OIA_14, ISSU_09 |

### PuB-EAA Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Relying Party validates PuB-EAA attestation                   │
├─────────────────────────────────────────────────────────────────┤
│  1. Extract signature from attestation                          │
│  2. Look up QTSP TL → find QTSP's qualified certificate         │
│  3. Validate signature using QTSP certificate (Art. 32)         │
│  4. Look up PuB-EAA Provider TL → verify issuer authorization   │
│  5. Verify certified attributes per Art. 45f                    │
│  6. Both pass → attestation is valid                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Non-qualified EAA Provider

| Question | Answer | Reference |
|----------|--------|-----------|
| Does Non-qualified EAA Provider TL exist? | **YES** (national extension) | [trust-infrastructure-schema.md](../../task2-trust-framework/trust-infrastructure-schema.md), [pid_eaa_provider_onboarding.md#L550](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md) |
| Does it contain signing cert? | **YES** (assumed) | Inferred - per Rulebook (Topic 12) |
| Where is signing cert created? | Non-qualified EAA Provider (internal) | Inferred |
| Where is signing cert submitted? | MS Registrar | ARF Topic 27 |
| Who compiles TL? | **MS TLP** (national EAA Provider TL) | [pid_eaa_provider_onboarding.md#L508](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md) |
| Number of TLs needed to validate? | **1** (national EAA Provider TL) | OIA_15, Topic 12 |

> **Note**: ARF states non-qualified EAA TL is "out of scope" but implemented as national extension.

---

## 5. Wallet Provider

| Question | Answer | Reference |
|----------|--------|-----------|
| Does Wallet Provider TL exist? | **YES** | [trust-infrastructure-schema.md#L26](../../task2-trust-framework/trust-infrastructure-schema.md) |
| Does it contain signing cert? | **YES** (for WUA validation) | EC TS2 Section 2.4, WPNot_02 |
| Where is signing cert created? | Wallet Provider (for Wallet Unit Attestation signing) | ISSU_21, ISSU_30 |
| Where is signing cert submitted? | MS → EC notification (no Registrar) | [trust-infrastructure-schema.md#L30](../../task2-trust-framework/trust-infrastructure-schema.md), GenNot_01 |
| Format of signing cert? | X.509 certificate chain (`x5c` per RFC 7515) | EC TS2 Section 2.2, CIR 2024/2980 Annex II 2.(h) |
| Who compiles TL? | European Commission | WPNot_04, WPNot_05 |
| Number of TLs needed to validate? | **1** (Wallet Provider TL) | ISSU_21, ISSU_30 |

---

## 6. Access CA (WRPAC Provider)

| Question | Answer | Reference |
|----------|--------|-----------|
| Does Access CA TL exist? | **YES** | [trust-infrastructure-schema.md#L27](../../task2-trust-framework/trust-infrastructure-schema.md) |
| Does it contain CA cert? | **YES** (CA root/intermediate certificate) | RPACANot_02, CIR 2024/2980 Annex II 4.(g) |
| What type of cert? | **CA certificate** (trust anchor for access certs) | EC TS2 Section 2.7 |
| Where is CA cert submitted? | MS → EC notification (no Registrar) | [trust-infrastructure-schema.md#L30](../../task2-trust-framework/trust-infrastructure-schema.md), GenNot_01 |
| Who compiles TL? | European Commission | RPACANot_04 |
| Number of TLs needed to validate? | **1** (Access CA TL) | RPA_04, ISSU_24, ISSU_34 |

> **Note**: Access CA TL contains **CA certificates** (trust anchors), not end-entity access certificates.

---

## 7. Relying Party

| Question | Answer | Reference |
|----------|--------|-----------|
| Does Relying Party TL exist? | **NO** | [trust-infrastructure-schema.md#L25](../../task2-trust-framework/trust-infrastructure-schema.md) |
| Does RP have signing cert? | **NO** - RPs don't sign attestations | N/A |
| How is RP trusted? | Via **Access Certificate** (issued by Access CA) | Reg_10a, RPA_04 |
| Where is RP validated? | Access CA TL (for access cert) + Registry (for registration) | [trust-infrastructure-schema.md#L25](../../task2-trust-framework/trust-infrastructure-schema.md) |

---

## Summary: Signing Certificate Location by Entity Type

| Entity Type | Signing Cert in TL? | Which TL? | Compiled By | # TLs to Validate |
|-------------|---------------------|-----------|-------------|-------------------|
| PID Provider | ✅ YES | PID Provider TL | EC | 1 |
| QEAA Provider | ✅ YES | National QTSP TL | MS TLP | 1 |
| PuB-EAA Provider | ❌ NO (in QTSP TL) | PuB-EAA TL + QTSP TL | EC + MS TLP | **2** |
| Non-qualified EAA | ✅ YES | National EAA TL | MS TLP | 1 |
| Wallet Provider | ✅ YES | Wallet Provider TL | EC | 1 |
| Access CA | ✅ YES (CA cert) | Access CA TL | EC | 1 |
| Relying Party | ❌ N/A | Not in any TL | N/A | 0 |

---

## Trust Anchor vs Signing Certificate

The term **"trust anchor"** in EC TS2 refers to the **signing certificate** used by credential issuers. This table clarifies the terminology:

| Entity Type | Trust Anchor Is | What It Signs | Reference to Documents | Document Citation |
|-------------|-----------------|---------------|------------------------|-------------------|
| PID Provider | **Signing certificate** | PID attestations | EC TS2 Section 2.5 | "The PID Provider trust anchor SHALL contain the certificate chain(s) used to sign PID" |
| QEAA Provider | **Qualified signing certificate** | QEAA attestations | eIDAS Article 3(12), ETSI EN 319 411-1 | "a qualified certificate for electronic signatures that is issued by a QTSP" |
| PuB-EAA Provider | **QTSP's qualified certificate** (external) | PuB-EAA attestations | CIR 2025/1569 Art. 5, eIDAS Art. 32 | "the signature...shall be validated using the QTSP certificate" |
| Non-qualified EAA | **Signing certificate** | EAA attestations | ARF Topic 12 | Per national implementation |
| Wallet Provider | **Signing certificate** | Wallet Unit Attestations | EC TS2 Section 2.4 | "The Wallet Provider trust anchor SHALL contain the certificate chain(s) used to sign WUA" |
| Access CA | **CA certificate** (root/intermediate) | Access Certificates (issues, not signs attestations) | EC TS2 Section 2.7, RFC 5280 | "The CA certificate serves as the trust anchor for validating access certificates" |
| Relying Party | **N/A** | N/A (RPs don't sign) | N/A | RPs validated via Access Certificate + Registry |

> **Key Distinction**: For credential issuers (PID, QEAA, Wallet Provider), **trust anchor = signing certificate** (the certificate whose private key signs attestations). For CAs, **trust anchor = CA certificate** (the certificate that issues end-entity certificates).

---

## Trust Anchor Format (EC TS2)

From EC TS2 Section 2.2 (`Provider.x5c`):

> `x5c`: specifies a sequence of **X.509 certificate chains** according to **RFC 7515**, where each certificate chain is compliant to **RFC 3647** and **RFC 5280**. Specifying more than one certificate chain here allows to support **key rollover procedures**.

| Format Aspect | Specification | Reference to Documents | Document Citation |
|---------------|---------------|------------------------|-------------------|
| Encoding | Base64-encoded X.509 | RFC 7515 Section 4.1.6 | "The 'x5c' (X.509 certificate chain) Header Parameter contains the X.509 public key certificate or certificate chain" |
| Structure | Certificate chain (end-entity + intermediates) | RFC 5280 Section 4 | "Certificate users MUST be able to validate the certificate path to a trusted anchor" |
| Profile | Compliant with RFC 3647 | CIR 2024/2980 Annex II | "certificate chain is compliant to RFC 3647 and RFC 5280" |
| Multiple chains | Supported (for key rollover) | EC TS2 Section 2.2 | "Specifying more than one certificate chain here allows to support key rollover procedures" |

---

## References

| Document | Link/Reference |
|----------|----------------|
| EC TS2 v1.0 | [ts2-notification-publication-provider-information.md](https://github.com/eu-digital-identity-wallet/eudi-doc-standards-and-technical-specifications/blob/main/docs/technical-specifications/ts2-notification-publication-provider-information.md) |
| Trust Infrastructure Schema | [trust-infrastructure-schema.md](../../task2-trust-framework/trust-infrastructure-schema.md) |
| PID/EAA Provider Onboarding | [pid_eaa_provider_onboarding.md](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md) |
| Trust Evaluation Matrix | [trusted-list-registration-trust-evaluation-matrix.md](../../task2-trust-framework/trusted-list-registration-trust-evaluation-matrix.md) |
| RP Evaluates Credentials | [relying-party-evaluates-credentials.md](../../task1-use-cases/subtask1-2-trust-registry/relying-party-evaluates-credentials.md) |
| CIR 2024/2980 | Notifications to Commission concerning EUDIW ecosystem |
| CIR 2025/1569 | PuB-EAA Provider notification |
| eIDAS Article 22 | Trusted Lists (QTSP publication) |
| eIDAS Article 32 | Qualified signature validation |
